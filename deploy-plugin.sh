#!/bin/bash

# deploys whatever's in ./build/dist as an ESXi UI plugin called docker-volume-plugin

# TODO: make these vars command line params

ESX_IP=192.168.73.131
SRC_PATH=.
PLUGIN_NAME=docker-volume-plugin
BUILD_PATH=${SRC_PATH}/build/dist/
echo $BUILD_PATH
scp -r $BUILD_PATH root@${ESX_IP}:/usr/lib/vmware/hostd/docroot/ui/plugins/${PLUGIN_NAME}/
