#!/bin/bash

# deploys whatever's in ./build/dist as an ESXi UI plugin called docker-volume-plugin

# TODO: make these vars command line params

rm -rf build/dist/*
grunt --env=dev
ESX_IP=192.168.73.131
SRC_PATH=.
PLUGIN_NAME=docker-volume-plugin
BUILD_PATH=${SRC_PATH}/build/dist
ssh root@${ESX_IP} rm -rf /usr/lib/vmware/hostd/docroot/ui/plugins/${PLUGIN_NAME}/
scp -r ${BUILD_PATH}/. root@${ESX_IP}:/usr/lib/vmware/hostd/docroot/ui/plugins/${PLUGIN_NAME}/
