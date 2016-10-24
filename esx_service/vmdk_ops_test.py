#!/usr/bin/env python
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
# limitations under the License.
'''
Tests for basic vmdk Operations

'''

import unittest
import sys
import logging
import glob
import os
import os.path

import vmdk_ops
import log_config
import volume_kv
import vsan_policy
import vsan_info
import vmdk_utils
from pyVim import connect
from pyVmomi import vim
import uuid
import auth
import auth_data


# will do creation/deletion in this folder:
global path

class VolumeNamingTestCase(unittest.TestCase):
    """Unit test for operations with volume names (volume@datastore)"""

    def test_name_parse(self):
        """checks name parsing and error checks
        'volume[@datastore]' -> volume and datastore"""
        testInfo = [
            #  [ full_name. expected_vol_name, expected_datastore_name,  expected_success? ]
            ["MyVolume123_a_.vol@vsanDatastore_11", "MyVolume123_a_.vol", "vsanDatastore_11", True],
            ["a1@x",                            "a1",                  "x",             True],
            ["a1",                              "a1",                  None,            True],
            ["1",                                "1",                 None,             True],
            ["strange-volume-10@vsan:Datastore",  "strange-volume-10",  "vsan:Datastore",     True],
            ["dashes-and stuff !@datastore ok",  "dashes-and stuff !",  "datastore ok",       True],
            ["no-snaps-please-000001@datastore", None,                 None,            False],
            ["TooLong0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789", None, None, False],
            ["Just100Chars0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567",
                           "Just100Chars0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567", None, True],
            ["Volume.123@dots.dot",              "Volume.123",        "dots.dot",       True],
            ["simple_volume",                    "simple_volume",      None,            True],
        ]
        for unit in testInfo:
            full_name, expected_vol_name, expected_ds_name, expected_result = unit
            try:
                vol, ds = vmdk_ops.parse_vol_name(full_name)
                self.assertTrue(expected_result,
                                "Expected volume name parsing to fail for '{0}'".format(full_name))
                self.assertEqual(vol, expected_vol_name, "Vol name mismatch '{0}' expected '{1}'" \
                                                         .format(vol, expected_vol_name))
                self.assertEqual(vol, expected_vol_name, "Datastore name: '{0}' expected: '{1}'" \
                                                         .format(ds, expected_ds_name))
            except vmdk_ops.ValidationError as ex:
                self.assertFalse(expected_result, "Expected vol name parsing to succeed for '{0}'"
                                 .format(full_name))


class VmdkCreateRemoveTestCase(unittest.TestCase):
    """Unit test for VMDK Create and Remove ops"""

    volName = "vol_UnitTest_Create"
    badOpts = {u'policy': u'good', volume_kv.SIZE: u'12unknown', volume_kv.DISK_ALLOCATION_FORMAT: u'5disk'}
    invalid_access_choice = {volume_kv.ACCESS: u'only-read'}
    invalid_access_opt = {u'acess': u'read-write'}
    valid_access_opt = {volume_kv.ACCESS: 'read-only'}
    invalid_attach_as_choice = {volume_kv.ATTACH_AS: u'persisten'}
    invalid_attach_as_opt = {u'atach-as': u'persistent'}
    valid_attach_as_opt_1 = {volume_kv.ATTACH_AS: u'persistent'}
    valid_attach_as_opt_2 = {volume_kv.ATTACH_AS: u'independent_persistent'}
    name = ""
    vm_name = 'test-vm'

    def setUp(self):
        self.name = vmdk_utils.get_vmdk_path(path, self.volName)
        self.policy_names = ['good', 'impossible']
        self.orig_policy_content = ('(("proportionalCapacity" i0) '
                                     '("hostFailuresToTolerate" i0))')
        self.new_policy_content = '(("hostFailuresToTolerate" i0))'
        for n in self.policy_names:
            vsan_policy.create(n, self.orig_policy_content)

    def tearDown(self):
        vmdk_ops.removeVMDK(self.name)
        self.vmdk = None
        for n in self.policy_names:
            vsan_policy.delete(n)

    def testCreateDelete(self):
        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=self.name,
                                  vol_name=self.volName)
        self.assertEqual(err, None, err)
        self.assertEqual(
            os.path.isfile(self.name), True,
            "VMDK {0} is missing after create.".format(self.name))
        err = vmdk_ops.removeVMDK(self.name)
        self.assertEqual(err, None, err)
        self.assertEqual(
            os.path.isfile(self.name), False,
            "VMDK {0} is still present after delete.".format(self.name))

    def testBadOpts(self):
        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=self.name,
                                  vol_name=self.volName,
                                  opts=self.badOpts)
        self.assertNotEqual(err, None, err)

        err = vmdk_ops.removeVMDK(self.name)
        self.assertNotEqual(err, None, err)

    def testAccessOpts(self):
        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=self.name,
                                  vol_name=self.volName,
                                  opts=self.invalid_access_choice)
        self.assertNotEqual(err, None, err)

        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=self.name,
                                  vol_name=self.volName,
                                  opts=self.invalid_access_opt)
        self.assertNotEqual(err, None, err)

        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=self.name,
                                  vol_name=self.volName,
                                  opts=self.valid_access_opt)
        self.assertEqual(err, None, err)
        err = vmdk_ops.removeVMDK(self.name)
        self.assertEqual(err, None, err)

    def testAttachAsOpts(self):
        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=self.name,
                                  vol_name=self.volName,
                                  opts=self.invalid_attach_as_choice)
        self.assertNotEqual(err, None, err)

        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=self.name,
                                  vol_name=self.volName,
                                  opts=self.invalid_attach_as_opt)
        self.assertNotEqual(err, None, err)

        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=self.name,
                                  vol_name=self.volName,
                                  opts=self.valid_attach_as_opt_1)
        self.assertEqual(err, None, err)

        err = vmdk_ops.removeVMDK(self.name)
        self.assertEqual(err, None, err)

        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=self.name,
                                  vol_name=self.volName,
                                  opts=self.valid_attach_as_opt_2)
        self.assertEqual(err, None, err)

        err = vmdk_ops.removeVMDK(self.name)
        self.assertEqual(err, None, err)


    @unittest.skipIf(not vsan_info.get_vsan_datastore(),
                    "VSAN is not found - skipping vsan_info tests")
    def testPolicyUpdate(self):
        path = vsan_info.get_vsan_dockvols_path()
        vmdk_path = vmdk_utils.get_vmdk_path(path, self.volName)
        err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                  vmdk_path=vmdk_path,
                                  vol_name=self.volName,
                                  opts={'vsan-policy-name': 'good'})
        self.assertEqual(err, None, err)
        self.assertEqual(None, vsan_policy.update('good',
                                                  self.new_policy_content))
        # Setting an identical policy returns an error msg
        self.assertNotEqual(None, vsan_policy.update('good',
                                                     self.new_policy_content))

        backup_policy_file = vsan_policy.backup_policy_filename(self.name)
        #Ensure there is no backup policy file
        self.assertFalse(os.path.isfile(backup_policy_file))

        # Fail to update because of a bad policy, and ensure there is no backup
        self.assertNotEqual(None, vsan_policy.update('good', 'blah'))
        self.assertFalse(os.path.isfile(backup_policy_file))


    @unittest.skipIf(not vsan_info.get_vsan_datastore(),
                    "VSAN is not found - skipping vsan_info tests")
    def testPolicy(self):
        # info for testPolicy
        testInfo = [
            #    size     policy   expected success?
            ["2000kb", "good", True, "zeroedthick"],
            ["14000pb", "good", False, "zeroedthick"],
            ["bad size", "good", False, "eagerzeroedthick"],
            ["100mb", "impossible", True, "eagerzeroedthick"],
            ["100mb", "good", True, "thin"],
        ]
        path = vsan_info.get_vsan_dockvols_path()
        i = 0
        for unit in testInfo:
            vol_name = '{0}{1}'.format(self.volName, i)
            vmdk_path = vmdk_utils.get_vmdk_path(path,vol_name)
            i = i+1
            # create a volume with requests size/policy and check vs expected result
            err = vmdk_ops.createVMDK(vm_name=self.vm_name,
                                      vmdk_path=vmdk_path,
                                      vol_name=vol_name,
                                      opts={volume_kv.VSAN_POLICY_NAME: unit[1],
                                            volume_kv.SIZE: unit[0],
                                            volume_kv.DISK_ALLOCATION_FORMAT: unit[3]})
            self.assertEqual(err == None, unit[2], err)

            # clean up should fail if the created should have failed.
            err = vmdk_ops.removeVMDK(vmdk_path)
            self.assertEqual(err == None, unit[2], err)



class ValidationTestCase(unittest.TestCase):
    """ Test validation of -o options on create """

    @unittest.skipIf(not vsan_info.get_vsan_datastore(),
                     "VSAN is not found - skipping vsan_info tests")

    def setUp(self):
        """ Create a bunch of policies """
        self.policy_names = ['name1', 'name2', 'name3']
        self.policy_content = ('(("proportionalCapacity" i50) '
                               '("hostFailuresToTolerate" i0))')
        self.path = vsan_info.get_vsan_datastore().info.url
        for n in self.policy_names:
            result = vsan_policy.create(n, self.policy_content)
            self.assertEquals(None, result,
                              "failed creating policy %s (%s)" % (n, result))

    def tearDown(self):
        for n in self.policy_names:
            try:
                vsan_policy.delete(n)
            except:
                pass

    def test_success(self):
        sizes = ['2gb', '200tb', '200mb', '5kb']
        sizes.extend([s.upper() for s in sizes])

        for s in sizes:
            for p in self.policy_names:
                for d in volume_kv.VALID_ALLOCATION_FORMATS:
                # An exception should not be raised
                    vmdk_ops.validate_opts({volume_kv.SIZE: s, volume_kv.VSAN_POLICY_NAME: p, volume_kv.DISK_ALLOCATION_FORMAT : d},
                                       self.path)
                    vmdk_ops.validate_opts({volume_kv.SIZE: s}, self.path)
                    vmdk_ops.validate_opts({volume_kv.VSAN_POLICY_NAME: p}, self.path)
                    vmdk_ops.validate_opts({volume_kv.DISK_ALLOCATION_FORMAT: d}, self.path)

    def test_failure(self):
        bad = [{volume_kv.SIZE: '2'}, {volume_kv.VSAN_POLICY_NAME: 'bad-policy'},
        {volume_kv.DISK_ALLOCATION_FORMAT: 'thiN'}, {volume_kv.SIZE: 'mb'}, {'bad-option': '4'}, {'bad-option': 'what',
                                                             volume_kv.SIZE: '4mb'}]
        for opts in bad:
            with self.assertRaises(vmdk_ops.ValidationError):
                vmdk_ops.validate_opts(opts, self.path)

class VmdkAttachDetachTestCase(unittest.TestCase):
    """ Unit test for VMDK Attach and Detach ops """

    volNamePre = "vol_UnitTest_Attach"
    vm_name = 'test-vm'
    max_vol_count = 60
    datastore_path = None
    datastore_name = None
    
    def setUp(self):
        """ Setup run before each test """
        logging.debug("VMDKAttachDetachTest setUp path =%s", path)
        self.cleanup()
        
        if (not self.datastore_name):
            datastores = vmdk_utils.get_datastores()
            datastore = datastores[0]
            if (not datastore):
                logging.error("Cannot find a valid datastore")
                self.assertFalse(True)
            self.datastore_name = datastore[0]
            self.datastore_path = datastore[2]
            logging.debug("datastore_name=%s datastore_path=%s", self.datastore_name,
                                                                 self.datastore_path)   
        
        # get service_instance, and create a VM
        if not vmdk_ops.si:
            vmdk_ops.connectLocal()

        self.create_vm(vmdk_ops.si, self.vm_name, self.datastore_name)

        # create max_vol_count+1 VMDK files
        for id in range(1, self.max_vol_count+2):
            volName = 'VmdkAttachDetachTestVol' + str(id)
            fullpath = os.path.join(self.datastore_path, volName + '.vmdk')
            self.assertEqual(None,
                                vmdk_ops.createVMDK(vm_name=self.vm_name,
                                                    vmdk_path=fullpath,
                                                    vol_name=volName))
            
    def tearDown(self):
        """ Cleanup after each test """
        logging.debug("VMDKAttachDetachTest tearDown path")
        self.cleanup()
    
    def create_vm(self, si, vm_name, datastore):
        content = si.RetrieveContent()
        datacenter = content.rootFolder.childEntity[0]
        vm_folder = datacenter.vmFolder
        hosts = datacenter.hostFolder.childEntity
        resource_pool = hosts[0].resourcePool

        datastore_path = '[' + datastore + '] ' + vm_name

        # bare minimum VM shell, no disks. Feel free to edit
        vmx_file = vim.vm.FileInfo(logDirectory=None,
                                   snapshotDirectory=None,
                                   suspendDirectory=None,
                                   vmPathName=datastore_path)


        config = vim.vm.ConfigSpec( 
                                name=vm_name, 
                                memoryMB=128, 
                                numCPUs=1,
                                files=vmx_file, 
                                guestId='rhel5_64Guest', 
                                version='vmx-11'
                              )

        task = vm_folder.CreateVM_Task(config=config, pool=resource_pool)
        vmdk_ops.wait_for_tasks(si, [task])

        vm = [d for d in si.content.rootFolder.childEntity[0].vmFolder.childEntity 
              if d.config.name == vm_name]
        if vm:
            logging.debug("Found: VM %s", vm_name)
            if vm[0].runtime.powerState == vim.VirtualMachinePowerState.poweredOff:
                logging.debug("Attempting to power on %s", vm_name)
                task = vm[0].PowerOnVM_Task()
                vmdk_ops.wait_for_tasks(si, [task])
        else:
            logging.error("Cannot find the test-vm")
            self.assertFalse(True) 
    
    def remove_vm(self, si, vm_name):

        vm = [d for d in si.content.rootFolder.childEntity[0].vmFolder.childEntity 
              if d.config.name == vm_name]
        if vm:
            logging.debug("Found: VM %s", vm_name)
            #logging.debug("The current powerState is  : %s", format(vm[0].runtime.powerState)))
            if vm[0].runtime.powerState == vim.VirtualMachinePowerState.poweredOn:
                logging.debug("Attempting to power off %s", vm_name)
                task = vm[0].PowerOffVM_Task()
                vmdk_ops.wait_for_tasks(si, [task])
            
            logging.debug("Trying to destroy VM %s", vm_name)    
            task = vm[0].Destroy_Task()
            vmdk_ops.wait_for_tasks(si, [task])
    
    def cleanup(self):
        # remove VM
        if not vmdk_ops.si:
            vmdk_ops.connectLocal()
        self.remove_vm(vmdk_ops.si, self.vm_name)

        for v in self.get_testvols():
            self.assertEqual(
                None,
                vmdk_ops.removeVMDK(os.path.join(v['path'], v['filename'])))

    def get_testvols(self):
        return [x
                for x in vmdk_utils.get_volumes(None)
                if x['filename'].startswith('VmdkAttachDetachTestVol')]

    
    def testAttachDetach(self):
        logging.debug("Start VMDKAttachDetachTest")

        if not vmdk_ops.si:
            vmdk_ops.connectLocal()
        #find test_vm
        vm = [d for d in vmdk_ops.si.content.rootFolder.childEntity[0].vmFolder.childEntity 
              if d.config.name == self.vm_name]
        self.assertNotEqual(None, vm)

        # attach max_vol_count disks
        for id in range(1, self.max_vol_count+1):
            volName = 'VmdkAttachDetachTestVol' + str(id)
            fullpath = os.path.join(self.datastore_path, volName + '.vmdk')
            ret = vmdk_ops.disk_attach(vmdk_path=fullpath,
                                       vm=vm[0])
            self.assertFalse("Error" in ret)

        # attach one more disk, which should fail    
        volName = 'VmdkAttachDetachTestVol' + str(self.max_vol_count+1)
        fullpath = os.path.join(self.datastore_path, volName + '.vmdk')
        ret = vmdk_ops.disk_attach(vmdk_path=fullpath,
                                   vm=vm[0])
        self.assertTrue("Error" in ret)

        # detach all the attached disks
        for id in range(1, self.max_vol_count+1):
            volName = 'VmdkAttachDetachTestVol' + str(id)
            fullpath = os.path.join(self.datastore_path, volName + '.vmdk')
            ret = vmdk_ops.disk_detach(vmdk_path=fullpath,
                                       vm=vm[0])
            self.assertTrue(ret is None)

class VmdkAuthorizeTestCase(unittest.TestCase):
    """ Unit test for VMDK Authorization """
    
    vm_name = 'test-vm'
    vm_uuid = str(uuid.uuid4())
        
    def setUp(self):
        self.auth_mgr = auth_data.AuthorizationDataManager()
        self.auth_mgr.connect()

    def test_vmdkop_authorize(self):
        vm_ds = 'datastore1'
        vms = [(self.vm_uuid, self.vm_name)]
        privileges = []
        default_datastore='default_ds'
        default_privileges = {'datastore': default_datastore,
                        'global_visibility': 0,
                        'create_volume': 0,
                        'delete_volume': 0,
                        'mount_volume': 0,
                        'max_volume_size': 0,
                        'usage_quota': 0}
                
        error_info, tenant1 = self.auth_mgr.create_tenant('vmdk_auth_test', 'Tenant used to vmdk_auth_test', default_datastore,
                                              default_privileges, vms, privileges)
        self.assertEqual(error_info, None)
        self.assertTrue(uuid.UUID(tenant1.id))

        # test CMD_CREATE without "create_volume" set
        privileges = [{'datastore': vm_ds,
                        'global_visibility': 0,
                        'create_volume': 0,
                        'delete_volume': 0,
                        'mount_volume': 1,
                        'max_volume_size': 500,
                        'usage_quota': 1000}]
        
        error_info = tenant1.set_datastore_access_privileges(self.auth_mgr.conn, privileges)
        self.assertEqual(error_info, None)
        opts={u'size': u'100MB', u'fstype': u'ext4'}
        error_info, tenant_uuid, tenant_name = auth.authorize(self.vm_uuid, vm_ds, auth.CMD_CREATE, opts)
        self.assertEqual(error_info, "No create privilege" )

        # set "create_volume" privilege to true 
        privileges = [{'datastore': vm_ds,
                        'global_visibility': 0,
                        'create_volume': 1,
                        'delete_volume': 0,
                        'mount_volume': 1,
                        'max_volume_size': 500,
                        'usage_quota': 1000}]

        error_info = tenant1.set_datastore_access_privileges(self.auth_mgr.conn, privileges)
        self.assertEqual(error_info, None)
        error_info, tenant_uuid, tenant_name = auth.authorize(self.vm_uuid, vm_ds, auth.CMD_CREATE, opts)
        self.assertEqual(error_info, None)

        if not error_info:
            error_info = auth.add_volume_to_volumes_table(tenant1.id, vm_ds, "VmdkAuthorizeTestVol1", 100)
            self.assertEqual(error_info, None)

        opts={u'size': u'600MB', u'fstype': u'ext4'}
        error_info, tenant_uuid, tenant_name = auth.authorize(self.vm_uuid, vm_ds, auth.CMD_CREATE, opts)
        # create a volume with 600MB which exceed the"max_volume_size", command should fail
        self.assertEqual(error_info, "volume size exceeds the max volume size limit") 

        opts={u'size': u'500MB', u'fstype': u'ext4'}
        error_info, tenant_uuid, tenant_name = auth.authorize(self.vm_uuid, vm_ds, auth.CMD_CREATE, opts)
        self.assertEqual(error_info, None)

        if not error_info:
            error_info = auth.add_volume_to_volumes_table(tenant1.id, vm_ds, "VmdkAuthorizeTestVol2", 500)
            self.assertEqual(error_info, None)
        
        opts={u'size': u'500MB', u'fstype': u'ext4'}
        error_info, tenant_uuid, tenant_name = auth.authorize(self.vm_uuid, vm_ds, auth.CMD_CREATE, opts)
        self.assertEqual(error_info, "The total volume size exceeds the usage quota")

        # delete volume
        error_info, tenant_uuid, tenant_name = auth.authorize(self.vm_uuid, vm_ds, auth.CMD_REMOVE, opts)
        self.assertEqual(error_info, "No delete privilege")

        privileges = [{'datastore': vm_ds,
                        'global_visibility': 0,
                        'create_volume': 1,
                        'delete_volume': 1,
                        'mount_volume': 1,
                        'max_volume_size': 500,
                        'usage_quota': 1000}]

        error_info = tenant1.set_datastore_access_privileges(self.auth_mgr.conn, privileges)
        self.assertEqual(error_info, None)

        error_info, tenant_uuid, tenant_name = auth.authorize(self.vm_uuid, vm_ds, auth.CMD_REMOVE, opts)
        self.assertEqual(error_info, None)

        # remove the tenant
        error_info = self.auth_mgr.remove_tenant(tenant1.id, False)
        self.assertEqual(error_info, None)
        error_info = self.auth_mgr.remove_volumes_from_volume_table(tenant1.id)
        self.assertEqual(error_info, None)        
                                                  
    
if __name__ == '__main__':
    log_config.configure()
    volume_kv.init()

    # Calculate the path
    paths = glob.glob("/vmfs/volumes/[a-zA-Z]*/dockvols")
    if paths:
        # WARNING: for many datastores with dockvols, this picks up the first
        path = paths[0]
    else:
        # create dir in a datastore (just pick first datastore if needed)
        path = glob.glob("/vmfs/volumes/[a-zA-Z]*")[0] + "/dockvols"
        logging.debug("Directory does not exist - creating %s", path)
        os.makedirs(path)

    logging.info("Directory used in test - %s", path)

    try:
        unittest.main()
    except:
        pass
    finally:
        if not paths:
            logging.debug("Directory clean up - removing  %s", path)
            os.removedirs(path)

        # If the unittest failed, re-raise the error
        raise
