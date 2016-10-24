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



def convert_to_MB(vol_size_str):
    """ For a given size string, return values in MB.

        Example:
        '100MB': return 100
        '100GB': return 100*1024
        
    """

    unit = vol_size_str[-2:]
    value = int(vol_size_str[:-2])
    conversions = {'MB' : 1,
                   'GB' : 1024,
                   'TB' : 1024*1024,
                   'PB' : 1024*1024*1024,
    }
    
    if unit.upper() in conversions.keys():
        value = value*conversions[unit]
    else:
        logging.error("Invalid volume size")
    return value  
    