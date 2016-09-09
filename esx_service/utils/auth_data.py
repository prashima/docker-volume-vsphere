# VM based authorization for docker volumes

import sqlite3
import uuid

class DbConnectionError(Exception):
    """ An exception thrown when connection to a sqlite database fails """

    def __init__(self, db_path):
        self.db_path = db_path

    def __str__(self):
        return "DB connection error %s" % self.db_path

class AuthorizationDataManager:
    """
    This class abstracts the creation, modification and retrieval of
    authorization data used by vmdk_ops as well as the VMODL interface for
    Docker volume management.
    """

    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None

    def __del__(self):
        if self.conn:
            self.conn.close()

    def connect(self):
        """
        Connect to a sqlite database file given by `db_path`. Ensure foreign key
        constraints are enabled on the database and set the return type for
        select operations to dict-like 'Rows' instead of tuples.

        Raises a ConnectionFailed exception of
        """
        self.conn = sqlite3.connect(self.db_path)

        # Return rows as Row instances instead of tuples
        self.conn.row_factory = sqlite3.Row

        if not self.conn:
            raise DbConnectionError(self.db_path)

    def create_tables(self):
        """
        Create the 3 tables used for per-datastore authorization.  This function
        should only be called once per datastore.  It will raise an exception if
        the schema file isn't accessible or the tables already exist.
        """
        with open('./docker-volume-auth-schema.sql') as f:
            sql = f.read()
            self.conn.executescript(sql)
            self.conn.commit()

    def create_tenant(self, name, description, vms, privileges):
        """
        Create a tenant in the database. A tenant id will be auto-generated and
        returned. vms are (vm_id, vm_name) pairs. Privileges are dictionaries
        with keys matching the row names in the privileges table. Tenant id is
        filled in for both the vm and privileges tables.
        """

        # Create the entry in the tenants table
        id = str(uuid.uuid4())
        self.conn.execute(
            "insert into tenants(id, name, description) values (?, ?, ?)",
            (id, name, description)
        )

        # Create the entries in the vms table
        vms = [(vm_id, vm_name, id) for (vm_id, vm_name) in vms]
        self.conn.executemany(
          "insert into vms(vm_id, vm_name, tenant_id) values (?, ?, ?)",
          vms
        )

        # Create the entries in the privileges table
        # TODO: data scrubbing, ensure all keys exist
        for p in privileges:
            p['tenant_id'] = id
        self.conn.executemany(
            """
            insert into privileges values
            (:tenant_id, :datastore, :global_visibility, :create_volume,
             :delete_volume, :mount_volume, :max_volume_size, :usage_quota)
            """,
            privileges
        )

        self.conn.commit()
        return id

    def add_vm_to_tenant(self, vm_id, vm_name, tenant_id):
        self.conn.execute(
            "insert into vms(vm_id, vm_name, tenant_id) values (?, ?, ?)",
            (vm_id, vm_name, tenant_id)
        )
        conn.commit()

