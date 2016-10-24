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

import unittest
import sys
import os
import shutil
import uuid
import glob
import vmdk_ops
import vmdk_utils
import volume_kv as kv
import vmdkops_admin
import random


class TestParsing(unittest.TestCase):
    """ Test command line arg parsing for all commands """

    def setUp(self):
        self.parser = vmdkops_admin.create_parser()

    def test_parse_ls_no_options(self):
        args = self.parser.parse_args(['ls'])
        self.assertEqual(args.func, vmdkops_admin.ls)
        self.assertEqual(args.c, None)

    def test_parse_ls_dash_c(self):
        args = self.parser.parse_args(
            'ls -c created-by,created'.split())
        self.assertEqual(args.func, vmdkops_admin.ls)
        self.assertEqual(args.c, ['created-by', 'created'])

    def test_parse_ls_dash_c_invalid_argument(self):
        self.assert_parse_error('ls -c personality')

    def test_policy_no_args_fails(self):
        self.assert_parse_error('policy')

    def test_policy_create_no_args_fails(self):
        self.assert_parse_error('policy create')

    def test_policy_create(self):
        content = 'some policy content'
        cmd = 'policy create --name=testPolicy --content'.split()
        cmd.append("some policy content")
        args = self.parser.parse_args(cmd)
        self.assertEqual(args.content, 'some policy content')
        self.assertEqual(args.func, vmdkops_admin.policy_create)
        self.assertEqual(args.name, 'testPolicy')

    def test_policy_rm(self):
        args = self.parser.parse_args('policy rm testPolicy'.split())
        self.assertEqual(args.func, vmdkops_admin.policy_rm)
        self.assertEqual(args.name, 'testPolicy')

    def test_policy_rm_no_args_fails(self):
        self.assert_parse_error('policy rm')

    def test_policy_ls(self):
        args = self.parser.parse_args('policy ls'.split())
        self.assertEqual(args.func, vmdkops_admin.policy_ls)

    def test_policy_ls_badargs(self):
        self.assert_parse_error('policy ls --name=yo')

    def test_tenant_create(self):
        pass

    def test_tenant_create_missing_option_fails(self):
        pass

    def test_tenant_rm(self):
        pass

    def test_tenant_rm_missing_name(self):
        self.assert_parse_error('tenant rm')

    def test_tenant_ls(self):
        pass

    def test_status(self):
        args = self.parser.parse_args(['status'])
        self.assertEqual(args.func, vmdkops_admin.status)

    def test_set_no_args(self):
        self.assert_parse_error('set')

    def test_set_no_volname(self):
        self.assert_parse_error('set --options="access=read-only"')

    def test_set_invalid_options(self):
        self.assert_parse_error('set --options="size=10gb"')
        self.assert_parse_error('set --options="acces=read-write"')
        self.assert_parse_error('set --options="attach-as=persisten"')

    def test_set_no_options(self):
        self.assert_parse_error('set --volume=volume_name')

    def test_set(self):
        args = self.parser.parse_args('set --volume=vol_name@datastore --options="access=read-only"'.split())
        self.assertEqual(args.func, vmdkops_admin.set_vol_opts)
        self.assertEqual(args.volume, 'vol_name@datastore')
        self.assertEqual(args.options, '"access=read-only"')

        args = self.parser.parse_args('set --volume=vol_name@datastore --options="attach-as=persistent"'.split())
        self.assertEqual(args.func, vmdkops_admin.set_vol_opts)
        self.assertEqual(args.volume, 'vol_name@datastore')
        self.assertEqual(args.options, '"attach-as=persistent"')

        args = self.parser.parse_args('set --volume=vol_name@datastore --options="attach-as=independent_persistent"'.split())
        self.assertEqual(args.func, vmdkops_admin.set_vol_opts)
        self.assertEqual(args.volume, 'vol_name@datastore')
        self.assertEqual(args.options, '"attach-as=independent_persistent"')

    # Usage is always printed on a parse error. It's swallowed to prevent clutter.
    def assert_parse_error(self, command):
        with open('/dev/null', 'w') as f:
            sys.stdout = f
            sys.stderr = f
            with self.assertRaises(SystemExit):
                args = self.parser.parse_args(command.split())
            sys.stdout = sys.__stdout__
            sys.stderr = sys.__stderr__


class TestLs(unittest.TestCase):
    """ Test ls functionality """

    def setUp(self):
        """ Setup run before each test """
        self.vol_count = 0
        self.cleanup()
        for (datastore, url_name, path) in vmdk_utils.get_datastores():
            if not self.mkdir(path):
                continue
            for id in range(5):
                volName = 'testvol' + str(id)
                fullpath = os.path.join(path, volName + '.vmdk')
                self.assertEqual(None,
                                 vmdk_ops.createVMDK(vm_name='test-vm',
                                                     vmdk_path=fullpath,
                                                     vol_name=volName))
                self.vol_count += 1

    def tearDown(self):
        """ Cleanup after each test """
        self.cleanup()

    def mkdir(self, path):
        """ Create a directory if it doesn't exist. Returns pathname or None. """
        if not os.path.isdir(path):
            try:
                os.mkdir(path)
            except OSError as e:
                return None
        return path

    def cleanup(self):
        for v in self.get_testvols():
            self.assertEqual(
                None,
                vmdk_ops.removeVMDK(os.path.join(v['path'], v['filename'])))

    def get_testvols(self):
        return [x
                for x in vmdk_utils.get_volumes(None)
                if x['filename'].startswith('testvol')]

    def test_ls_helpers(self):
        volumes = self.get_testvols()
        self.assertEqual(len(volumes), self.vol_count)
        for v in volumes:
            metadata = vmdkops_admin.get_metadata(os.path.join(v['path'], v[
                'filename']))
            self.assertNotEqual(None, metadata)

    def test_ls_no_args(self):
        volumes = vmdk_utils.get_volumes(None)
        header = vmdkops_admin.all_ls_headers()
        rows = vmdkops_admin.generate_ls_rows()
        expected_column_count = 11
        self.assertEqual(expected_column_count, len(header))
        self.assertEqual(len(volumes), len(rows))
        for i in range(len(volumes)):
            self.assertEqual(volumes[i]['filename'], rows[i][0] + '.vmdk')

class TestSet(unittest.TestCase):
    """ Test set functionality """

    def setUp(self):
        """ Setup run before each test """
        self.vol_count = 0
        self.cleanup()
        for (datastore, url_name, path) in vmdk_utils.get_datastores():
            if not self.mkdir(path):
                continue
            for id in range(5):
                volName = 'testvol' + str(id)
                fullpath = os.path.join(path, volName + '.vmdk')
                self.assertEqual(None,
                                 vmdk_ops.createVMDK(vm_name='test-vm',
                                                     vmdk_path=fullpath,
                                                     vol_name=volName))
                self.vol_count += 1

    def tearDown(self):
        """ Cleanup after each test """
        self.cleanup()

    def mkdir(self, path):
        """ Create a directory if it doesn't exist. Returns pathname or None. """
        if not os.path.isdir(path):
            try:
                os.mkdir(path)
            except OSError as e:
                return None
        return path

    def cleanup(self):
        for v in self.get_testvols():
            self.assertEqual(
                None,
                vmdk_ops.removeVMDK(os.path.join(v['path'], v['filename'])))

    def get_testvols(self):
        return [x
                for x in vmdk_utils.get_volumes(None)
                if x['filename'].startswith('testvol')]

    def test_set_attach_as(self):
        volumes = self.get_testvols()
        self.assertEqual(len(volumes), self.vol_count)
        for v in volumes:
            attach_as_opt = random.choice(kv.ATTACH_AS_TYPES)
            # generate string like "testvol0@datastore1"
            vol_arg = '@'.join([v['filename'].replace('.vmdk', ''), v['datastore']])
            
            attach_as_arg = 'attach-as={}'.format(attach_as_opt)
            set_ok = vmdk_ops.set_vol_opts(vol_arg, attach_as_arg)
            self.assertTrue(set_ok)

            metadata = vmdkops_admin.get_metadata(os.path.join(v['path'], v[
                'filename']))
            self.assertNotEqual(None, metadata)

            curr_attach_as = vmdkops_admin.get_attach_as(metadata)
            self.assertEqual(attach_as_opt, curr_attach_as)
    
    def test_set_access(self):
        volumes = self.get_testvols()
        self.assertEqual(len(volumes), self.vol_count)
        for v in volumes:
            access_opt = random.choice(kv.ACCESS_TYPES)
            # generate string like "testvol0@datastore1"
            vol_arg = '@'.join([v['filename'].replace('.vmdk', ''), v['datastore']])
            access_arg = 'access={}'.format(access_opt)
            set_ok = vmdk_ops.set_vol_opts(vol_arg, access_arg)
            self.assertTrue(set_ok)

            metadata = vmdkops_admin.get_metadata(os.path.join(v['path'], v[
                'filename']))
            self.assertNotEqual(None, metadata)

            curr_access = vmdkops_admin.get_access(metadata)
            self.assertEqual(access_opt, curr_access)
    
        


if __name__ == '__main__':
    kv.init()
    unittest.main()
