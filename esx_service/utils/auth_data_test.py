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

# Tests for auth.py

import unittest
import os
import os.path
import auth_data
import uuid

class TestAuthDataModel(unittest.TestCase):
    """
    Test the Authorization data model via the AuthorizationDataManager
    """
    db_path = os.path.join('/tmp/test-auth.db')

    def setUp(self):
        try:
            os.unlink(self.db_path)
        except:
            pass

        self.auth_mgr = auth_data.AuthorizationDataManager(self.db_path)
        self.auth_mgr.connect()
        self.auth_mgr.create_tables()

#    def tearDown(self):
#        os.unlink(self.db_path)

    def test_create_tenant(self):
        vms = [(str(uuid.uuid4()), 'vm1')]
        privileges = [{'datastore': 'datastore1',
                      'global_visibility': 0,
                      'create_volume': 0,
                      'delete_volume': 0,
                      'mount_volume': 0,
                      'max_volume_size': 0,
                      'usage_quota': 0}]
        #privileges = []
        id = self.auth_mgr.create_tenant('tenant1', 'Some tenant', vms, privileges)
        self.assertTrue(uuid.UUID(id))

if __name__ == "__main__":
    unittest.main()
