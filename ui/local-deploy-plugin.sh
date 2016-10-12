#!/bin/bash

# deploys whatever's in ./build/dist as an ESXi UI plugin called docker-volume-plugin

# TODO: make these vars command line params
# meanwhile you must change the ESX_IP to the actual IP address of your VM


ESX_IP=192.168.73.136

echo $ESX_IP
echo "deploying to ${ESX_IP}"

rm -rf build/dist/*
grunt --env=dev

SRC_PATH=.
PLUGIN_NAME=docker-volume-plugin
BUILD_PATH=${SRC_PATH}/build/dist
ssh root@${ESX_IP} mkdir /usr/lib/vmware/hostd/docroot/ui/plugins
ssh root@${ESX_IP} rm -rf /usr/lib/vmware/hostd/docroot/ui/plugins/${PLUGIN_NAME}/
scp -r ${BUILD_PATH}/. root@${ESX_IP}:/usr/lib/vmware/hostd/docroot/ui/plugins/${PLUGIN_NAME}/
