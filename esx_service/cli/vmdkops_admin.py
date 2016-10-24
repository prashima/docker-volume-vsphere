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

# Admin CLI for vmdk_opsd

import argparse
import os
import subprocess
import sys

import vmdk_ops
# vmdkops python utils are in PY_LOC, so add to path.
sys.path.insert(0, vmdk_ops.PY_LOC)

import volume_kv as kv
import cli_table
import vsan_policy
import vmdk_utils
import vsan_info
import log_config

NOT_AVAILABLE = 'N/A'

def main():
    kv.init()
    args = parse_args()
    if args:
       args.func(args)


def commands():
    """
    This function returns a dictionary representation of a CLI specification that is used to
    generate a CLI parser. The dictionary is recursively walked in the `add_subparser()` function
    and appropriate calls are made to the `argparse` module to create a CLI parser that fits the
    specification.

    Each key in the top level of the dictionary is a command string. Each command may contain the
    following keys:

    * func - The callback function to be called when the command is issued. This key is always
             present unless there are subcommands, denoted by a 'cmds' key.

    * help - The help string that is printed when the `-h` or `--help` paramters are given without
             reference to a given command. (i.e. `./vmdkops_admin.py -h`). All top level help
             strings are printed in this instance.

    * args - A dictionary of any positional or optional arguments allowed for the given command. The
             args dictionary may contain the following keys:

             * help - The help for a given option which is displayed when the `-h` flag is given
                      with mention to a given command. (i.e. `./vmdkops_admin.py ls -h`). Help for
                      all options are shown for the command.

             * action - The action to take when the option is given. This is directly passed to
                        argparse. Note that `store_true` just means pass the option to the callback
                        as a boolean `True` value and don't require option parameters.
                        (i.e. `./vmdkops_admin.py ls -l`). Other options for the action value can be
                        found in the argparse documentation.
                        https://docs.python.org/3/library/argparse.html#action

             * metavar - A way to refer to each expected argument in help documentation. This is
                         directly passed to argparse.
                         See https://docs.python.org/3/library/argparse.html#metavar

             * required - Whether or not the argument is required. This is directly passed to
                          argparse.

             * type - A type conversion function that takes the option parameter and converts it
                      to a given type before passing it to the func callback. It prints an error and
                      exits if the given argument cannot be converted.
                      See https://docs.python.org/3/library/argparse.html#type

             * choices - A list of choices that can be provided for the given option. This list is
                         not directly passed to argparse. Instead a type conversion function is
                         created that only allows one or more of the choices as a comma separated
                         list to be supplied. An error identical to the one presented when using the
                         'choices' option in argparse is printed if an invalid choice is given. The
                         rationale for not directly using the argparse choices option is that
                         argparse requires space separated arguments of the form: `-l a b c`, rather
                         than the defacto single argument, comma separated form: `-l a,b,c`, common
                         to most unix programs.

    * cmds - A dictionary of subcommands where the key is the next word in the command line string.
             For example, in `vmdkops_admin.py tenant create`, `tenant` is the command, and `create` is
             the subcommand. Subcommands can have further subcommands, but currently there is only
             one level of subcommands in this specification. Each subcommand can contain the same
             attributes as top level commands: (func, help, args, cmds). These attributes have
             identical usage to the top-level keys, except they only apply when the subcommand is
             part of the command. For example the `--vm-list` argument only applies to `tenant
             create` or `tenant set` commands. It will be invalid in any other context.

             Note that the last subcommand in a chain is the one where the callback function is
             defined. For example, `tenant create` has a callback, but if a user runs the program
             like: `./vmdkops_admin.py tenant` they will get the following error:
             ```
             usage: vmdkops_admin.py tenant [-h] {rm,create,set,ls,get} ...
             vmdkops_admin.py tenant: error: too few arguments
             ```
    """
    return {
        'ls': {
            'func': ls,
            'help': 'List volumes',
            'args': {
                '-c': {
                    'help': 'Display selected columns',
                    'choices': ['volume', 'datastore', 'created-by', 'created',
                                'attached-to', 'policy', 'capacity', 'used',
                                'fstype', 'access', 'attach-as'],
                    'metavar': 'Col1,Col2,...'
                },
                '--tenant' : {
                    'help': 'Displays VMs for a given tenant'
                }
            }
        },
        'policy': {
            'help': 'Configure and display storage policy information',
            'cmds': {
                'create': {
                    'func': policy_create,
                    'help': 'Create a storage policy',
                    'args': {
                        '--name': {
                            'help': 'The name of the policy',
                            'required': True
                        },
                        '--content': {
                            'help': 'The VSAN policy string',
                            'required': True
                        }
                    }
                },
                'rm': {
                    'func': policy_rm,
                    'help': 'Remove a storage policy',
                    'args': {
                        'name': {
                            'help': 'Policy name'
                        }
                    }
                },
                'ls': {
                    'func': policy_ls,
                    'help':
                    'List storage policies and volumes using those policies'
                },
                'update': {
                    'func': policy_update,
                    'help': ('Update the definition of a storage policy and all'
                              'VSAN objects using that policy'),
                    'args': {
                        '--name': {
                            'help': 'The name of the policy',
                            'required': True
                        },
                        '--content': {
                            'help': 'The VSAN policy string',
                            'required': True
                        }
                    }
                }
            }
        },
        #
        # tenant {create, rm , ls} - manipulates tenants
        # tenant vm {add, rm, ls}  - manipulates VMs for a tenant
        # tenant access {add, set, rm, ls} - manipulates datastore access right for a tenant
        #
        'tenant': {
            'help': 'Administer and monitor volume access control',
            'cmds': {
                'create': {
                    'func': tenant_create,
                    'help': 'Create a new tenant',
                    'args': {
                        '--name': {
                            'help': 'The name of the tenant',
                            'required': True
                        },
                        # a shortcut allowing to add VMs on Tenant Create
                        '--vm-list': {
                            'help': 'A list of VM names to place in this Tenant',
                            'metavar': 'vm1, vm2, ...',
                            'type': comma_seperated_string
                        }
                    }
                },
                'rm': {
                    'func': tenant_rm,
                    'help': 'Delete a tenant',
                    'args': {
                        'name': {
                            'help': 'The name of the tenant',
                      },
                      '--remove-volumes': {
                        'help': 'BE CAREFUL: Removes this tenant volumes when removing a tenant'
                      }
                    }
                },
                'ls': {
                    'func': tenant_ls,
                    'help': 'List tenants and the VMs they are applied to'
                },
                'vm': {
                    'help': 'Add, removes and lists VMs in a tenant',
                    'cmds': {
                        'add': {
                            'help': 'Add a VM(s)  to a tenant',
                            'func': tenant_vm_add,
                            'args': {
                                '--name': {
                                    'help': "Tenant to add the VM to",
                                    'required': True
                                },
                                '--vm-list': {
                                    'help': "A list of VM names to add to this Tenant",
                                    'type': comma_seperated_string,
                                    'required': True
                                }
                            }
                        },
                        'rm': {
                            'help': 'Remove VM(s) from a tenant',
                            'func': tenant_vm_rm,
                            'args': {
                                '--name': {
                                    'help': "Tenant to remove the VM from",
                                    'required': True
                                },
                                '--vm-list': {
                                    'help': "A list of VM names to rm from this Tenant",
                                    'type': comma_seperated_string,
                                    'required': True
                                }
                            }
                        },
                        'ls': {
                            'help': "list VMs in a tenant",
                            'func': tenant_vm_ls,
                            'args': {
                                '--name': {
                                    'help': "Tenant to list the VMs for",
                                    'required': False
                                }
                            }
                        }
                    }
                },
                'access': {
                    'help': 'Add or remove Datastore access and quotas for a tenant',
                    'cmds': {
                        'add': {
                            'func': tenant_access_add,
                            'help': 'Add a datastore access for a tenant',
                            'args': {
                                '--name': {
                                    'help': 'The name of the tenant',
                                    'required': True
                                },
                                '--datastore': {
                                    'help': "Datastore which access is controlled",
                                    'required': True
                                },
                                '--rights': {
                                    'help': 'Datastore access Permissions granted',
                                    'choices': ['create', 'delete', 'mount', 'all'],
                                    'metavar': 'create,delete,mount'
                                },
                                '--volume-maxsize': {
                                    'help': 'Maximum size of the volume that can be created',
                                    'metavar': 'Num{MB,GB,TB} - e.g. 2TB'
                                },
                                '--volume-maxcount': {
                                    'help': 
                                    'Maximum number of volumes to create on the datastore for this tenant'
                                },
                                '--volume-totalsize': {
                                    'help': 
                                    'Maximum total size of all volume that can be created on the datastore for this tenant',
                                    'metavar': 'Num{MB,GB,TB} - e.g. 2TB'
                                }
                            }
                        },
                        'set': {
                            'func': tenant_access_set,
                            'help': 'Modify datastore access for a tenant',
                            'args': {
                                '--name': {
                                    'help': 'Tenant name',
                                    'required': True
                                },
                                '--datastore': {
                                    'help': "Datastore name",
                                    'required': True
                                },
                                '--add-rights': {
                                    'help': 'Datastore access Permissions granted',
                                    'choices': ['create', 'delete', 'mount', 'all'],
                                    'metavar': 'create,delete,mount,all'
                                }, 
                                '--rm-rights': {
                                    'help': 'Datastore access Permissions removed',
                                    'choices': ['create', 'delete', 'mount', 'all'],
                                    'metavar': 'create,delete,mount,all'
                                },
                                '--volume-maxsize': {
                                    'help': 'Maximum size of the volume that can be created',
                                    'metavar': 'Num{MB,GB,TB} - e.g. 2TB'
                                },
                                '--volume-maxcount': {
                                    'help': 
                                    'Maximum number of volumes to create on the datastore for this tenant'
                                },
                                '--volume-totalsize': {
                                    'help': 
                                    'Maximum total size of all volume that can be created on the datastore for this tenant',
                                    'metavar': 'Num{MB,GB,TB} - e.g. 2TB'
                                }
                            }
                        },
                        'rm': {
                            'func': tenant_access_rm,
                            'help': "Remove all access to a datastore for a tenant",
                            'args': {
                                '--name': {
                                    'help': 'The name of the tenant',
                                    'required': True
                                },
                                '--datastore': {
                                    'help': "Datstore which access is controlled",
                                    'required': True
                                }
                            }
                        },
                        'ls': {
                            'func': tenant_access_ls,
                            'help': 'List all access info for a tenant',
                            'args': {
                                '--name': {
                                    'help': 'The name of the tenant',
                                    'required': True
                                }
                            }
                        }
                    }
                }
            }
        },
        'status': {
            'func': status,
            'help': 'Show the status of the vmdk_ops service'
        },
        'set': {
            'func': set_vol_opts,
            'help': 'Edit settings for a given volume',
            'args': {
                '--volume': {
                    'help': 'Volume to set options for, specified as "volume@datastore".',
                    'required': True
                },
                '--options': {
                    'help': 'Options (specifically, access) to be set on the volume.',
                    'required': True
                }
            }
        }
    }


def create_parser():
    """ Create a CLI parser via argparse based on the dictionary returned from commands() """
    parser = argparse.ArgumentParser(description='Manage VMDK Volumes')
    add_subparser(parser, commands())
    return parser


def add_subparser(parser, cmds_dict):
    """ Recursively add subcommand parsers based on a dictionary of commands """
    subparsers = parser.add_subparsers()
    for cmd, attributes in cmds_dict.items():
        subparser = subparsers.add_parser(cmd, help=attributes['help'])
        if 'func' in attributes:
            subparser.set_defaults(func=attributes['func'])
        if 'args' in attributes:
            for arg, opts in attributes['args'].items():
                opts = build_argparse_opts(opts)
                subparser.add_argument(arg, **opts)
        if 'cmds' in attributes:
            add_subparser(subparser, attributes['cmds'])


def build_argparse_opts(opts):
    if 'choices' in opts:
        opts['type'] = make_list_of_values(opts['choices'])
        help_opts = opts['help']
        opts['help'] = '{0}: Choices = {1}'.format(help_opts, opts['choices'])
        del opts['choices']
    return opts


def parse_args():
    parser = create_parser()
    args = parser.parse_args()
    if args != argparse.Namespace():
       return args
    else:
       parser.print_help()


def comma_seperated_string(string):
    return string.split(',')


def make_list_of_values(allowed):
    """
    Take a list of allowed values for an option and return a function that can be
    used to typecheck a string of given values and ensure they match the allowed
    values.  This is required to support options that take comma separated lists
    such as --rights in 'tenant set --rights=create,delete,mount'
    """

    def list_of_values(string):
        given = string.split(',')
        for g in given:
            if g not in allowed:
                msg = (
		   'invalid choices: {0} (choices must be a comma separated list of '
                   'only the following words \n {1}. '  
		   'No spaces are allowed between choices.)').format(g, repr(allowed).replace(' ', ''))
                raise argparse.ArgumentTypeError(msg)
        return given

    return list_of_values


def ls(args):
    """
    Print a table of all volumes and their datastores when called with no args.
    If args.l is True then show all metadata in a table.
    If args.c is not empty only display columns given in args.c (implies -l).
    """
    if args.c:
        (header, rows) = ls_dash_c(args.c)
    else:
        header = all_ls_headers()
        rows = generate_ls_rows()
    if args.tenant:
        print("TBD: print volumes for the given tenant ", args.tenant)  # TODO
    print(cli_table.create(header, rows))


def ls_dash_c(columns):
    """ Return only the columns requested in the format required for table construction """
    all_headers = all_ls_headers()
    all_rows = generate_ls_rows()
    indexes = []
    headers = []
    choices = commands()['ls']['args']['-c']['choices']
    for i in range(len(choices)):
        if (choices[i]) in columns:
            indexes.append(i)
            headers.append(all_headers[i])
    rows = []
    for row in all_rows:
        rows.append([row[i] for i in indexes])
    return (headers, rows)


def all_ls_headers():
    """ Return a list of all header for ls -l """
    return ['Volume', 'Datastore', 'Created By VM', 'Created',
            'Attached To VM', 'Policy', 'Capacity', 'Used',
            'Filesystem Type', 'Access', 'Attach As']

def generate_ls_rows():
    """ Gather all volume metadata into rows that can be used to format a table """
    rows = []
    for v in vmdk_utils.get_volumes(None):
        path = os.path.join(v['path'], v['filename'])
        name = vmdk_utils.strip_vmdk_extension(v['filename'])
        metadata = get_metadata(path)
        attached_to = get_attached_to(metadata)
        policy = get_policy(metadata, path)
        size_info = get_vmdk_size_info(path)
        created, created_by = get_creation_info(metadata)
        fstype = get_fstype(metadata)
        access = get_access(metadata)
        attach_as = get_attach_as(metadata)
        rows.append([name, v['datastore'], created_by, created, attached_to,
                     policy, size_info['capacity'], size_info['used'],
                     fstype, access, attach_as])
    return rows


def get_creation_info(metadata):
    """
    Return the creation time and creation vm for a volume given its metadata
    """
    try:
        return (metadata[kv.CREATED], metadata[kv.CREATED_BY])
    except:
        return (NOT_AVAILABLE, NOT_AVAILABLE)


def get_attached_to(metadata):
    """ Return which VM a volume is attached to based on its metadata """
    try:
        return metadata[kv.ATTACHED_VM_NAME]
    except:
        return kv.DETACHED

def get_attach_as(metadata):
    """ Return which mode a volume is attached as based on its metadata """
    try:
        return metadata[kv.VOL_OPTS][kv.ATTACH_AS]
    except:
        return kv.DEFAULT_ATTACH_AS


def get_access(metadata):
    """ Return the access mode of a volume based on its metadata """
    try:
       return metadata[kv.VOL_OPTS][kv.ACCESS]
    except:
        return kv.DEFAULT_ACCESS

def get_policy(metadata, path):
    """ Return the policy for a volume given its volume options """
    try:
        return metadata[kv.VOL_OPTS][kv.VSAN_POLICY_NAME]
    except:
        pass

    if vsan_info.is_on_vsan(path):
        return kv.DEFAULT_VSAN_POLICY
    else:
        return NOT_AVAILABLE


def get_fstype(metadata):
    """ Return the Filesystem Type of the volume based on its metadata """
    try:
        return metadata[kv.VOL_OPTS][kv.FILESYSTEM_TYPE]
    except:
        return NOT_AVAILABLE


def get_metadata(volPath):
    """ Take the absolute path to volume vmdk and return its metadata as a dict """
    return kv.getAll(volPath)


def get_vmdk_size_info(path):
    """
    Get the capacity and used space for a given VMDK given its absolute path.
    Values are returned as strings in human readable form (e.g. 10.00MB)

    Currently this data is retrieved via a call to vmkfstools.
    The output being parsed looks like the following:

    Capacity bytes: 209715200
    Used bytes: 27262976
    Unshared bytes: 27262976
    """
    try:
        cmd = "vmkfstools --extendedstatinfo {0}".format(path).split()
        output = subprocess.check_output(cmd)
        result = output.decode('utf-8')
        lines = result.split('\n')
        capacity_in_bytes = lines[0].split()[2]
        used_in_bytes = lines[1].split()[2]
        return {'capacity': human_readable(int(capacity_in_bytes)),
                'used': human_readable(int(used_in_bytes))}
    except subprocess.CalledProcessError:
        sys.exit("Failed to stat {0}.".format(path) \
            + " VMDK corrupted. Please remove and then retry")


KB = 1024
MB = 1024*KB
GB = 1024*MB
TB = 1024*GB
def human_readable(size_in_bytes):
    """
    Take an integer size in bytes and convert it to MB, GB, or TB depending
    upon size.
    """
    if size_in_bytes >= TB:
        return '{:.2f}TB'.format(size_in_bytes/TB)
    if size_in_bytes >= GB:
        return '{:.2f}GB'.format(size_in_bytes/GB)
    if size_in_bytes >= MB:
        return '{:.2f}MB'.format(size_in_bytes/MB)
    if size_in_bytes >= KB:
        return '{:.2f}KB'.format(size_in_bytes/KB)

    return '{0}B'.format(size_in_bytes)


def policy_create(args):
    output = vsan_policy.create(args.name, args.content)
    if output:
        print(output)
    else:
        print('Successfully created policy: {0}'.format(args.name))


def policy_rm(args):
    output = vsan_policy.delete(args.name)
    if output:
        print(output)
    else:
        print('Successfully removed policy: {0}'.format(args.name))


def policy_ls(args):
    volumes = vsan_policy.list_volumes_and_policies()
    policies = vsan_policy.get_policies()
    header = ['Policy Name', 'Policy Content', 'Active']
    rows = []
    used_policies = {}
    for v in volumes:
        policy_name = v['policy']
        if policy_name in used_policies:
            used_policies[policy_name] = used_policies[policy_name] + 1
        else:
            used_policies[policy_name] = 1

    for name, content in policies.items():
        if name in used_policies:
            active = 'In use by {0} volumes'.format(used_policies[name])
        else:
            active = 'Unused'
        rows.append([name, content.strip(), active])

    print(cli_table.create(header, rows))


def policy_update(args):
    output = vsan_policy.update(args.name,  args.content)
    if output:
        print(output)
    else:
        print('Successfully updated policy: {0}'.format(args.name))


def status(args):
    print("Version: {0}".format(get_version()))
    (status, pid) = get_service_status()
    print("Status: {0}".format(status))
    if pid:
        print("Pid: {0}".format(pid))
        print("Port: {0}".format(get_listening_port(pid)))
    print("LogConfigFile: {0}".format(log_config.LOG_CONFIG_FILE))
    print("LogFile: {0}".format(log_config.LOG_FILE))
    print("LogLevel: {0}".format(log_config.get_log_level()))


def set_vol_opts(args):
    try:
        set_ok = vmdk_ops.set_vol_opts(args.volume, args.options) 
        if set_ok:
           print('Successfully updated settings for : {0}'.format(args.volume))
        else:
           print('Failed to update {0} for {1}.'.format(args.options, args.volume))
    except Exception as ex:
        print('Failed to update {0} for {1} - {2}.'.format(args.options,
                                                           args.volume,
                                                           str(ex)))


VMDK_OPSD = '/etc/init.d/vmdk-opsd'
PS = 'ps -c | grep '
GREP_V_GREP = ' | grep -v grep'
NOT_RUNNING_STATUS = ("Stopped", None)

def get_service_status():
    """
    Determine whether the service is running and it's PID. Return the 2 tuple
    containing a status string and PID. If the service is not running, PID is
    None
    """
    try:
        output = subprocess.check_output([VMDK_OPSD, "status"]).split()
        if output[2] == "not":
            return NOT_RUNNING_STATUS

        pid = output[3].split("=")[1]
        return ("Running", pid)
    except subprocess.CalledProcessError:
        return NOT_RUNNING_STATUS


def get_listening_port(pid):
    """ Return the configured port that the service is listening on """
    try:
        cmd = "{0}{1}{2}".format(PS, pid, GREP_V_GREP)
        output = subprocess.check_output(cmd, shell=True).split()[6]
        return output
    except:
        return NOT_AVAILABLE


def get_version():
    """ Return the version of the installed VIB """
    try:
        cmd = 'localcli software vib list | grep esx-vmdkops-service'
        return subprocess.check_output(cmd, shell=True).split()[1]
    except:
        return NOT_AVAILABLE


NOT_IMPLEMENTED = "Not implemented"

def tenant_create(args):
    print(NOT_IMPLEMENTED)

def tenant_rm(args):
    print(NOT_IMPLEMENTED)

def tenant_ls(args):
    print(NOT_IMPLEMENTED)

def tenant_vm_add(args):
    print(NOT_IMPLEMENTED)

def tenant_vm_rm(args):
    print(NOT_IMPLEMENTED)

def tenant_vm_ls(args):
    print(NOT_IMPLEMENTED)

def tenant_access_add(args):
    print(NOT_IMPLEMENTED)

def tenant_access_set(args):
    print(NOT_IMPLEMENTED)

def tenant_access_rm(args):
    print(NOT_IMPLEMENTED)

def tenant_access_ls(args):
    print(NOT_IMPLEMENTED)

if __name__ == "__main__":
    main()
