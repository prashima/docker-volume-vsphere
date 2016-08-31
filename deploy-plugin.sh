#!/bin/bash

# deploy docker-volume-plugin to ESXi

ESX_IP=192.168.73.131
#CURR_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
#echo $CURR_PATH
#SRC_PATH=${CURR_PATH}/docker-volume-plugin
SRC_PATH=./docker-volume-plugin
PLUGIN_NAME=docker-volume-plugin
BUILD_PATH=${SRC_PATH}/build/dist/
echo $BUILD_PATH
scp -r $BUILD_PATH root@${ESX_IP}:/usr/lib/vmware/hostd/docroot/ui/plugins/${PLUGIN_NAME}/
