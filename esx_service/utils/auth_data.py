# Copyright 2016 VMware, Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License

""" VM based authorization for docker volumes and tenant management.

"""

import sqlite3
import uuid
import os
import vmdk_utils
import vmdk_ops
import logging
import auth_data_const

AUTH_DB_PATH = '/etc/vmware/vmdkops/auth-db'

def all_columns_set(privileges):
        if not privileges:
            return False
        
        all_columns = [
                        auth_data_const.COL_DATASTORE,
                        auth_data_const.COL_GLOBAL_VISIBILITY,
                        auth_data_const.COL_CREATE_VOLUME,
                        auth_data_const.COL_DELETE_VOLUME,
                        auth_data_const.COL_MOUNT_VOLUME,
                        auth_data_const.COL_MAX_VOLUME_SIZE,
                        auth_data_const.COL_USAGE_QUOTA
                      ]
        for col in all_columns:
            if not col in privileges:
                return False

        return True 
 
class DbConnectionError(Exception):
    """ An exception thrown when connection to a sqlite database fails. """

    def __init__(self, db_path):
        self.db_path = db_path

    def __str__(self):
        return "DB connection error %s" % self.db_path

class DockerVolumeTenant:
    """ This class abstracts the operations to manage a DockerVolumeTenant.

    The interfaces it provides includes:
    - add VMs to tenant
    - revmove VMs from tenant
    - change tenant name and description
    - set datastore and privileges for a tenant

    """

    def __init__(self, name, description, default_datastore, default_privileges,
                    vms, privileges, id=None):
            """ Constuct a DockerVOlumeTenant object. """
            self.name = name
            self.description = description
            self.default_datastore = default_datastore
            self.default_privileges = default_privileges
            self.vms = vms
            self.privileges = privileges
            if not id:
                self.id = str(uuid.uuid4())
            else:
                self.id = id
        
    def add_vms(self, conn, vms):
        """ Add vms in the vms table for this tenant. """
        tenant_id = self.id
        vms = [(vm_id, vm_name, tenant_id) for (vm_id, vm_name) in vms]
        if vms:
            try:
                conn.executemany(
                  "INSERT INTO vms(vm_id, vm_name, tenant_id) VALUES (?, ?, ?)",
                  vms
                )
                conn.commit()
            except sqlite3.Error, e:
                logging.error("Error %s when insert into vms table with vm_id %s vm_name %s"
                "tenant_id %s", e, vm_id, vm_name, tenenat_id)
                return str(e)

        return None        
                 

    def remove_vms(self, conn, vms):
        """ Remove vms from the vms table for this tenant. """
        tenant_id = self.id
        vms = [(vm_id, tenant_id) for (vm_id, vm_name) in vms]
        try:
            conn.executemany(
                    "DELETE FROM vms WHERE vm_id = ? AND tenant_id = ?", 
                    vms
            )
            conn.commit()
        except sqlite3.Error, e:
            logging.error("Error %s when remove from vms table with vm_id %s tenant_id"
                "tenant_id %s", e, vm_id,tenenat_id)
            return str(e)

        return None

    def set_name(self, conn, name):
        """ Set name column in tenant table for this tenant. """
        tenant_id = self.id
        try:
            conn.execute(
                    "UPDATE tenants SET name = ? WHERE id = ?", 
                    (name, tenant_id)
            )
            conn.commit()
        except sqlite3.Error, e:
            logging.error("Error %s when update tenants table with tenant_id"
                "tenant_id %s", e, tenenat_id)
            return str(e)
        
        return None

    
    def set_description(self, conn, description):
        """ Set description column in tenant table for this tenant. """
        tenant_id = self.id
        try:
            conn.execute(
                    "UPDATE tenants SET description = ? WHERE id = ?", 
                    (description, tenant_id)
             )
            conn.commit()
        except sqlite3.Error, e:
            logging.error("Error %s when update tenants table with tenant_id"
                "tenant_id %s", e, tenant_id)
            return str(e)
        
        return None
        
    def set_default_datastore_and_privileges(self, conn, datastore, privileges):
        "Set default_datastore and default privileges for this tenant."
        tenant_id = self.id
        exist_default_datastore = self.default_datastore
        if not all_columns_set(privileges):
            error_info = "Not all columns are set in privileges"
            return error_info

        try:
            conn.execute(
                    "UPDATE tenants SET default_datastore = ? WHERE id = ?", 
                    (datastore, tenant_id)
            )

            # remove the old entry
            conn.execute(
                    "DELETE FROM privileges WHERE tenant_id = ? AND datastore = ?", 
                    [tenant_id, exist_default_datastore]
            )

            
            privileges[auth_data_const.COL_TENANT_ID] = tenant_id
            conn.execute(
                """
                INSERT OR IGNORE INTO privileges VALUES
                (:tenant_id, :datastore, :global_visibility, :create_volume,
                :delete_volume, :mount_volume, :max_volume_size, :usage_quota)
                """,
                privileges
            )
            conn.commit()
        except sqlite3.Error, e:
            logging.error("Error %s when setting dafault dtastore and privileges for tenant_id %s", 
                          e, tenant_id)
            return str(e)
      
        return None
            
    def set_datastore_access_privileges(self, conn, privileges):
        """ Set datastore and privileges for this tenant.

            "privileges"" is an array of dict
            each dict represent a privilege that the tenant has for a given datastore

            Example:
            privileges = [{'datastore': 'datastore1',
                           'global_visibility': 0,
                           'create_volume': 0,
                           'delete_volume': 0,
                           'mount_volume': 1,
                           'max_volume_size': 0,
                           'usage_quota': 0},
                          {'datastore': 'datastore2',
                           'global_visibility': 0,
                           'create_volume': 1,
                           'delete_volume': 1,
                           'mount_volume': 1,
                           'max_volume_size': 0,
                           'usage_quota': 0}]
        
        """
        tenant_id = self.id
        for p in privileges:
            p[auth_data_const.COL_TENANT_ID] = tenant_id
            if not all_columns_set(p):
                err_info = "Not all columns are set in privileges"
                return error_info
                            
        try:
            conn.executemany(
                """
                INSERT OR IGNORE INTO privileges VALUES
                (:tenant_id, :datastore, :global_visibility, :create_volume,
                :delete_volume, :mount_volume, :max_volume_size, :usage_quota)
                """,
                privileges
            )
            
            for p in privileges:
                # privileges ia an array of dict
                # each dict represent a privilege that the tenant has for a given datastore
                # for each dict, add a new element which maps 'tenant_id' to tenant_id 
                p[auth_data_const.COL_TENANT_ID] = tenant_id
                column_list = ['tenant_id', 'datastore', 'global_visibility', 'create_volume',
                                'delete_volume', 'mount_volume', 'max_volume_size', 'usage_quota']
                update_list = []
                update_list = [p[col] for col in column_list]    
                update_list.append(tenant_id)
                update_list.append(p[auth_data_const.COL_DATASTORE])    
                
                logging.debug("set_datastore_access_privileges: update_list %s", update_list)

                conn.execute(
                    """
                    UPDATE OR IGNORE privileges SET
                        tenant_id = ?, 
                        datastore = ?, 
                        global_visibility = ?,
                        create_volume = ?,
                        delete_volume = ?,
                        mount_volume = ?,
                        max_volume_size = ?,
                        usage_quota = ?
                    WHERE tenant_id = ? AND datastore = ?
                    """,
                    update_list
                )
            conn.commit()
        except sqlite3.Error, e:
            logging.error("Error %s when setting datastore and privileges for tenant_id %s", 
                          e, tenant_id)
            return str(e)
        
        return None

class AuthorizationDataManager:
    """ This class abstracts the creation, modification and retrieval of
    authorization data used by vmdk_ops as well as the VMODL interface for
    Docker volume management.

    init arg:
    The constructor of this class takes "db_path" as an argument.
    "db_path" specifies the path of sqlite3 database
    If caller does not pass the value of this argument, function "get_auth_db_path"
    will be called to figure out the value
    otherwise, the value passed by caller will be used

    """

    def __init__(self, db_path=None):
        if not db_path:
            self.db_path = self.get_auth_db_path()
        else:
            self.db_path = db_path
        self.conn = None

    def __del__(self):
        if self.conn:
            self.conn.close()
    
    def get_auth_db_path(self):
        """ Return the path of authorization database.

        DB tables should be stored in VSAN datastore
        DB file should be stored under /vmfs/volume/VSAN_datastore/
        See issue #618
        Currently, it is hardcoded.

        """
        return AUTH_DB_PATH

    def connect(self):
        """ Connect to a sqlite database file given by `db_path`. 
        
        Ensure foreign key
        constraints are enabled on the database and set the return type for
        select operations to dict-like 'Rows' instead of tuples.

        Raises a ConnectionFailed exception when connect fails.

        """
        need_create_table = False

        if not os.path.isfile(self.db_path):
            logging.debug("auth DB %s does not exist, try to create table", self.db_path)
            need_create_table = True
            
            
        self.conn = sqlite3.connect(self.db_path)

        # Return rows as Row instances instead of tuples
        self.conn.row_factory = sqlite3.Row

        if not self.conn:
            raise DbConnectionError(self.db_path)
        
        if need_create_table:
            self.create_tables()

    def create_tables(self):
        """ Create tables used for per-datastore authorization.  
        
        This function should only be called once per datastore.  
        It will raise an exception if the schema file isn't 
        accessible or the tables already exist.

        """
        try:
            self.conn.execute(
                '''
                    PRAGMA foreign_key = ON;
                '''   

            )
            self.conn.execute(
                '''
                    CREATE TABLE tenants(
                    -- uuid for the tenant, which is generated by create_tenant() API
                    id TEXT PRIMARY KEY NOT NULL,
                    -- name of the tenant, which is specified by user when creating the tenant
                    -- this field can be changed later by using set_name() API
                    name TEXT,
                    -- brief description of the tenant, which is specified by user when creating the tenant
                    -- this field can be changed laster by using set_description API
                    description TEXT,
                    -- not use currently
                    default_datastore TEXT
                    )
                '''
            )

            self.conn.execute(
                '''
                CREATE TABLE vms(
                -- uuid for the VM, which is generated when VM is created
                -- this uuid will be passed in to executeRequest()
                -- this field need to be specified when adding a VM to a tenant
                vm_id TEXT PRIMARY KEY NOT NULL,
                -- name of the VM, which is generated when VM is created
                -- this field need to be specified when adding a VM to a tenant
                vm_name TEXT,
                -- id in tenants table
                tenant_id TEXT NOT NULL,
                FOREIGN KEY(tenant_id) REFERENCES tenants(id)
                );
                '''
            )


            self.conn.execute(
                '''
                CREATE TABLE privileges(
                -- id in tenants table
                tenant_id TEXT NOT NULL,
                -- datastore name
                datastore TEXT NOT NULL,
                -- not use currently, will drop this field later
                global_visibility INTEGER,
                create_volume INTEGER,
                delete_volume INTEGER,
                mount_volume INTEGER,
                -- The unit of "max_volume_size" is "MB"
                max_volume_size INTEGER,
                -- The unit of usage_quota is "MB"
                usage_quota INTEGER,
                PRIMARY KEY (tenant_id, datastore),
                FOREIGN KEY(tenant_id) REFERENCES tenants(id)
                );
                '''
            )

            self.conn.execute(
                '''
                CREATE TABLE volumes (
                -- id in tenants table
                tenant_id TEXT NOT NULL,
                -- datastore name
                datastore TEXT NOT NULL,
                volume_name TEXT,
                -- The unit of "volume_size" is "MB"
                volume_size INTEGER,
                PRIMARY KEY(tenant_id, datastore, volume_name),
                FOREIGN KEY(tenant_id) REFERENCES tenants(id)
                );
                '''
            )

            self.conn.commit()
        except sqlite3.Error, e:
            logging.error("Error %s when creating auth DB tables %s", 
                          e, tenant_id)
            return str(e)

        return None        

    def create_tenant(self, name, description, default_datastore, default_privileges, 
                      vms, privileges):
        """ Create a tenant in the database. 
        
        A tenant id will be auto-generated and returned. 
        vms are (vm_id, vm_name) pairs. Privileges are dictionaries
        with keys matching the row names in the privileges table. Tenant id is
        filled in for both the vm and privileges tables.

        """

        # Create the entry in the tenants table
        tenant = DockerVolumeTenant(name, description, default_datastore,
                                    default_privileges, vms, privileges)
        id = tenant.id
        if not default_privileges:
            if not all_columns_set(default_privileges):
                error_info = "Not all columns are set in default_privileges"
                return error_info
        
        if not privileges:
            for p in privileges:
                if not all_columns_set(p):
                    error_info = "Not all columns are set in privileges"
                    return error_info
        try:
            self.conn.execute(
                "INSERT INTO tenants(id, name, description, default_datastore) VALUES (?, ?, ?, ?)",
                (id, name, description, default_datastore)
            )

            # Create the entries in the vms table
            vms = [(vm_id, vm_name, id) for (vm_id, vm_name) in vms]
                
            if vms:
                self.conn.executemany(
                "INSERT INTO vms(vm_id, vm_name, tenant_id) VALUES (?, ?, ?)",
                vms
                )

            # Create the entries in the privileges table
            default_privileges[auth_data_const.COL_TENANT_ID] = id
            self.conn.execute(
                """
                INSERT INTO privileges VALUES
                (:tenant_id, :datastore, :global_visibility, :create_volume,
                :delete_volume, :mount_volume, :max_volume_size, :usage_quota)
                """,
                default_privileges
            )
           
            for p in privileges:
                p[auth_data_const.COL_TENANT_ID] = id
           
            self.conn.executemany(
                """
                INSERT INTO privileges VALUES
                (:tenant_id, :datastore, :global_visibility, :create_volume,
                :delete_volume, :mount_volume, :max_volume_size, :usage_quota)
                """,
                privileges
            )
            self.conn.commit()
        except sqlite3.Error, e:
            logging.error("Error %s when setting datastore and privileges for tenant_id %s", 
                          e, tenant.id)
            return str(e), tenant

        return None, tenant
    
    def list_tenants(self):
        """ Return a list of DockerVolumeTenants objects. """
        tenant_list = []
        try:
            cur = self.conn.execute(
            "SELECT * FROM tenants"
            )
            result = cur.fetchall()
        
            for r in result:
                # loop through each tenant
                id = r[auth_data_const.COL_ID]
                name = r[auth_data_const.COL_NAME]
                description = r[auth_data_const.COL_DESCRIPTION]
                default_datastore = r[auth_data_const.COL_DEFAULT_DATASTORE]
                
                # search vms for this tenant
                vms = []
                cur = self.conn.execute(
                    "SELECT * FROM vms WHERE tenant_id = ?",
                    (id,)
                )
                vms = cur.fetchall()
                
                # search privileges and default_privileges for this tenant
                privileges = []
                cur = self.conn.execute(
                    "SELECT * FROM privileges WHERE tenant_id = ? AND datastore != ?",
                    (id,default_datastore)    
                )
                privileges = cur.fetchall()

                default_privileges = []
                cur = self.conn.execute(
                    "SELECT * FROM privileges WHERE tenant_id = ? AND datastore = ?",
                    (id,default_datastore)    
                )
                default_privileges = cur.fetchall()
                tenant = DockerVolumeTenant(name, description, default_datastore,
                                            default_privileges, vms, privileges, id)
                tenant_list.append(tenant)
        except sqlite3.Error, e:    
            logging.error("Error %s when listing all tenants", e)
            return str(e), tenant_list

        return None, tenant_list   
    
    def remove_volumes_from_volume_table(self, tenant_id):
        """ Remove all volumes from volumes table. """
        try:
            self.conn.execute(
                    "DELETE FROM volumes WHERE tenant_id = ?",  
                    [tenant_id]
            )

            self.conn.commit()
        except sqlite3.Error, e:
            logging.error("Error %s when removing volumes from volumes table for tenant_id %s",
                          e, tenant_id)
            return str(e)
        
        return None
    
    def _remove_volumes_for_tenant(self, tenant_id):
        """ Delete all volumes belongs to this tenant.

            Do not use it outside of removing a tenant.

        """
        try:
            cur = self.conn.execute(
            "SELECT name FROM tenants WHERE id = ?",
            (tenant_id,)
            )
            result = cur.fetchone()
        except sqlite3.Error, e:
            logging.error("Error %s when querying from tenants table", e)
            return str(e)

        logging.debug("remove_volumes_for_tenant: %s %s", tenant_id, result)
        tenant_name = result[0]
        vmdks = vmdk_utils.get_volumes(tenant_name)
        # Delete all volumes for this tenant. 
        dir_path = None
        for vmdk in vmdks:
            vmdk_path = os.path.join(vmdk['path'], "{0}".format(vmdk['filename']))
            if not dir_path:
                dir_path = vmdk['path']
            print("path=%s filename=%s", vmdk['path'], vmdk['filename'])    
            logging.debug("Deleting volume path%s", vmdk_path)
            err = vmdk_ops.removeVMDK(vmdk_path)
            if err:
                logging.error("remove vmdk %s failed with error %s", vmdk_path, err)
                if err:
                    return err
        
        # Delete path /vmfs/volumes/datastore_name/tenant_name
        logging.debug("Deleting dir path%s", dir_path)
        try:
            os.rmdir(dir_path)
        except os.error as e:
            logging.error("remove dir %s failed with error %s", dir_path, e)
            return str(e)
                
        error_info = self.remove_volumes_from_volume_table(tenant_id)

        if error_info:
            return error_info
        
        return None

    def remove_tenant(self, tenant_id, remove_volumes):
        """ Remove a tenant with given id.

            A row with given tenant_id will be removed from table tenants, vms, 
            and privileges.
            All the volumes created by this tenant will be removed if remove_volumes
            is set to True. 

        """
        if remove_volumes:
            error_info = self._remove_volumes_for_tenant(tenant_id)
            if error_info:
                return error_info

        try:
            self.conn.execute(
                    "DELETE FROM vms WHERE tenant_id = ?", 
                    [tenant_id]
            )

            self.conn.execute(
                    "DELETE FROM privileges WHERE tenant_id = ?", 
                    [tenant_id]
            )
            self.conn.execute(
                    "DELETE FROM tenants WHERE id = ?", 
                    [tenant_id]
            )

            self.conn.commit()
        except sqlite3.Error, e:
            logging.error("Error %s when removing tables", e)
            return str(e) 

        return None 
