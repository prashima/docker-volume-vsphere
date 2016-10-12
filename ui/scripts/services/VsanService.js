define(['angular', 'vsphere'], function (angular, vsphere) {
   'use strict';

   var VsanConstant = {
         //TODO: split the constant to another js file?
         MOR_TYPE_DATASTORE: 'Datastore',
         MOR_TYPE_COMPUTE_RESOURCE : 'ComputeResource',
         MOR_TYPE_VCSA_DEPLOY_SYSTEM: 'VsanVcsaDeployerSystem',
         MOR_VAL_VCSA_DEPLOY_SYSTEM: 'vsan-vcsa-deployer-system',
         MOR_TYPE_NETWORK: 'Network',
         TYPE_VSAN_DATASTORE: 'vsan',
         OVA_UPLOAD_DIR: 'ova5',
         SINGLE_NODE_VSAN_POLICY_STRING: '(("hostFailuresToTolerate" i0))',
         DISK_STATE_ELIGIBLE: 'eligible',
         ENUM_DISK_CLAIM_TYPE: {
            DO_NOT_CLAIM: 'do_not_claim',
            CACHE_TIER: 'cache_tier',
            CAPACITY_TIRE: 'capacity_tire'
         },
         ENUM_NETWORK_MODE: {
            DHCP: 'dhcp',
            STATIC: 'static'
         },
         ENUM_DISKMAPPING_TYPE: {
            ALL_FLASH: 'allflash',
            HYBRID: 'hybrid'
         },
         INTERVAL_QUERY_TASK: 5000,
         MAX_CLUSTER_NAME_LENGTH: 80,
         LICENSE_REGEX: /^([A-Za-z0-9]{5}-?){4}[A-Za-z0-9]{5}$/,
         OVA_REGEX: /\.ova$/i,
         PASSWORD_REGEX: /(?=.*[A-Z]+)(?=.*[a-z]+)(?=.*\d+)(?=.*\W+).{8,20}/,
         DEFAULT_DOMAIN_NAME: 'vsphere.local',
         DEFAULT_SITE_NAME: 'Default-First_Site',

         VCSA_DEPLOY_WIZARD_NAME: 'vcsa.deploy.wizard.name',
    };








   return function (
      $rootScope, $q, $log, $location, $interval, $filter, $timeout, $sce, $window,
      VIMService, TaskService, StorageService, NotificationService, AuthService, StorageManager,
      APPLICATION_EVENTS, vuiConstants
   ) {
      $log = $log.getInstance('VsanService');
      //Cache of vsan health service
      var cache = null;
      var VsanServiceWarp = function() {
         this.api = null;
         this.types = null;
         this.deploySystemRef = null;
      };

      // this.getTenants = function() {
      //   return this.isVsanEnabled()
      //     .then(function(res) {
      //       console.log('isVsanEnabled: ' + res);
      //       return res;
      //     }, function(err) {
      //       console.log('ERROR: isVsanEnabled: ' + err);
      //     })
      //     .then(function(enabled) {
      //       if (!enabled) {
      //         console.log('calling enableVsan ');
      //         enableVsan();
      //       }
      //     });
      // };

      this.getTenants = function() {

        var hostname = '192.168.73.133';
        var port = 9096;
        //var _csrfToken = "i3i1jmqgf8e0z06nhvjbq7opsjwsfec6";
        var _csrfToken = StorageManager.get('csrf_token', null);
        var _proxy = true;

        return vsphere.createVsanHealthService(hostname + ':' + port, {
           proxy: _proxy,
           csrfToken: _csrfToken,
           csrfTokenHeader: 'VMware-CSRF-Token'
        }).then(function (service) {

          //console.log(Object.keys(service.vsanHealthPort).sort());

          var cluster = new service.vim.ManagedObjectReference({
            type: 'ComputeResource',
            value: 'compute-resource'
          });

          // var cluster = new service.vim.ManagedObjectReference({
          //   type: 'VsanClusterHealthSystem',
          //   value: 'vsan-cluster-health-system'
          // });

          // var perfMoRef =  new service.vim.ManagedObjectReference({
          //    type: 'VsanPerformanceManager',
          //    value: 'vsan-performance-manager'
          // });
          // var perfMoRef =  new service.vim.ManagedObjectReference({
          //    type: 'HostVsanHealthSystem',
          //    value: 'host-vsan-health-system'
          // });
          var perfMoRef =  new service.vim.ManagedObjectReference({
             type: 'VimHostVsanDockerPersistentVolumeSystem',
             value: 'vsan-docker-persistent-volumes'
          });
          // var perfMoRef =  new service.vim.ManagedObjectReference({
          //   type: 'VsanPerformanceManager',
          //   value: 'vsan-performance-manager'
          // });

          //var p = service.vsanHealthPort.vsanHostQueryVerifyNetworkSettings(perfMoRef, '', '');

          var p = service.vsanHealthPort.vsanPerfQueryStatsObjectInformation(perfMoRef, cluster);
          return p;
        });
      };


      var getVsanService = function() {
         var deferred = $q.defer();
         if (cache === null) {
            var hostname = VIMService.getHostname();
            vsphere.createVsanHealthService(hostname, {
               proxy: $location.host() !== hostname
            }).then(function (service) {
               $log.debug('created vsan health service');
               cache = new VsanServiceWarp();
               cache.api = service.vsanHealthPort;
               cache.types = service.vim;
               cache.deploySystemRef = new service.vim.ManagedObjectReference({
                  type: VsanConstant.MOR_TYPE_VCSA_DEPLOY_SYSTEM,
                  value: VsanConstant.MOR_VAL_VCSA_DEPLOY_SYSTEM
               });

               deferred.resolve(cache);
            }, function(error) {
               deferred.reject(error);
            });
         } else {
            deferred.resolve(cache);
         }

         return deferred.promise;
      };

      this.isVsanEnabled = function() {
         var deferred = $q.defer();

         VIMService.getVSANConfig().then(function(config) {
            $log.debug('VSAN is ' + (config.enabled ? 'enabled' : 'disabled'));
            deferred.resolve(config.enabled);
         }, function(error) {
            $log.error('Failed to get VSAN config', error);
            deferred.resolve(false);
         });

         return deferred.promise;
      };

      //Enable vsan at very beginning of vcsa bootstrap
      //Check if vsan is enabled and if disabled then enable it
      var enableVsan = function() {
         var deferred = $q.defer();

         VIMService.getVSANConfig().then(function(config) {
            if (config.enabled) {
               deferred.resolve();
               return;
            }
            config.enabled = true;
            config.storageInfo = null;
            config.clusterInfo = null;
            config.networkInfo = null;
            VIMService.setVSANConfig(config).then(function(task) {
               TaskService.registerTaskListener(function(result) {
                  if (result.state.value === 'error') {
                     $log.error('update VSAN task failed', result);
                     TaskService.removeTaskListener(this, task);
                     deferred.reject(result);

                     NotificationService.fire(APPLICATION_EVENTS.NOTIFICATION_APP.key, [{
                        type: vuiConstants.notifications.type.ERROR,
                        msg: result.error.localizedMessage
                     }]);
                  } else if (result.state.value === 'success') {
                     $log.debug('update VSAN task success');
                     // Defer resolution by 5 seconds, as vsan mgmt daemon isn't
                     // ready yet when VSAN task completes.
                     $timeout(function () {
                        deferred.resolve();
                     }, 5000);
                     TaskService.removeTaskListener(this, task);
                  } else {
                     $log.error('update VSAN task:' + result.state.value);
                  }
               }, task);
            }, function (error) {
               deferred.reject(error);
            });
         }, function (error) {
            deferred.reject(error);
         });

         return deferred.promise;
      };

      /**
       * @param rawSpec
       * @param service Service instance of vsan health service
       */
      var vcsaBootstrapInternal = function(rawSpec, service) {
         var deferred = $q.defer();

         var VsanVcsaBootstrapOntoVsanSpec = service.types['VsanVcsaBootstrapOntoVsanSpec'],
            VsanVcsaDeploymentSpec = service.types['VsanVcsaDeploymentSpec'],
            VimVsanHostDiskMappingCreationSpec = service.types['VimVsanHostDiskMappingCreationSpec'],
            VsanVcPostDeployConfigSpec = service.types['VsanVcPostDeployConfigSpec'],
            HostConnectSpec = service.types['HostConnectSpec'],
            HostScsiDisk = service.types['HostScsiDisk'],
            VsanHostVsanDiskInfo = service.types['VsanHostVsanDiskInfo'],
            VsanDataEfficiencyConfig = service.types['VsanDataEfficiencyConfig'],
            ScsiLunDescriptor = service.types['ScsiLunDescriptor'],
            ScsiLunDurableName = service.types['ScsiLunDurableName'],
            ScsiLunCapabilities = service.types['ScsiLunCapabilities'],
            ManagedObjectReference = service.types['ManagedObjectReference'],
            HostDiskDimensionsLba = service.types['HostDiskDimensionsLba'];

         //VC config related data
         var vcsaDeploymentSpec = new VsanVcsaDeploymentSpec(rawSpec.vcConfig);

         //Disk mapping related data
         var diskMappingCreationSpec = null;
         if (rawSpec.vsanDiskMappingCreationSpec) {
            diskMappingCreationSpec = new VimVsanHostDiskMappingCreationSpec(rawSpec.vsanDiskMappingCreationSpec);
            //Format HostScsiDisk for cacheDisks in VimVsanHostDiskMappingCreationSpec
            diskMappingCreationSpec.cacheDisks = diskMappingCreationSpec.cacheDisks.map(function (disk) {
               var cacheDisk = new HostScsiDisk(disk);
               cacheDisk.descriptor = cacheDisk.descriptor.map(function (desc) {
                  return new ScsiLunDescriptor(desc);
               });
               cacheDisk.vsanDiskInfo = cacheDisk.vsanDiskInfo ?
                  new VsanHostVsanDiskInfo(disk.vsanDiskInfo) : null;
               cacheDisk.capabilities = new ScsiLunCapabilities(cacheDisk.capabilities);
               cacheDisk.capacity = new HostDiskDimensionsLba(cacheDisk.capacity);
               return cacheDisk
            });

            //Format HostScsiDisk for capacityDisks in VimVsanHostDiskMappingCreationSpec
            diskMappingCreationSpec.capacityDisks = diskMappingCreationSpec.capacityDisks.map(function (disk) {
               var capacityDisk = new HostScsiDisk(disk);
               capacityDisk.vsanDiskInfo = capacityDisk.vsanDiskInfo ?
                  new VsanHostVsanDiskInfo(disk.vsanDiskInfo) : null;
               capacityDisk.descriptor = capacityDisk.descriptor.map(function (desc) {
                  return new ScsiLunDescriptor(desc);
               });
               capacityDisk.capacity = new HostDiskDimensionsLba(capacityDisk.capacity);
               capacityDisk.capabilities = new ScsiLunCapabilities(capacityDisk.capabilities);
               return capacityDisk
            });
            diskMappingCreationSpec.host = new ManagedObjectReference(diskMappingCreationSpec.host);
         }

         //Format VsanVcPostDeployConfigSpec
         var postDeployConfig = new VsanVcPostDeployConfigSpec(rawSpec.vcPostDeployConfig);
         postDeployConfig.firstHost = new HostConnectSpec(rawSpec.vcPostDeployConfig.firstHost);
         postDeployConfig.firstHost.force = false;
         postDeployConfig.hostsToAdd = postDeployConfig.hostsToAdd.map(function (spec) {
            var hostConnectSpec = new HostConnectSpec(spec);
            hostConnectSpec.force = false;
            return hostConnectSpec;
         });
         postDeployConfig.vsanDataEfficiencyConfig = new VsanDataEfficiencyConfig(postDeployConfig.vsanDataEfficiencyConfig);

         var vcsaBootstrapSpec = new VsanVcsaBootstrapOntoVsanSpec(rawSpec);
         vcsaBootstrapSpec.vcConfig = vcsaDeploymentSpec;
         vcsaBootstrapSpec.vsanDiskMappingCreationSpec = diskMappingCreationSpec;
         vcsaBootstrapSpec.vcPostDeployConfig = postDeployConfig;
         vcsaBootstrapSpec.portgroup = new ManagedObjectReference({
            type: VsanConstant.MOR_TYPE_NETWORK,
            value: rawSpec.portgroup
         });

         service.api.vsanVcsaBootstrapOntoVsan(service.deploySystemRef, vcsaBootstrapSpec).then(function(taskId) {
            deferred.resolve(taskId);
         }, function(error) {
            deferred.reject(error);
         });

         return deferred.promise;
      };

      var getVsanBootstrapTaskProgress = function(taskId) {
         $log.debug('Attempting to get progress of VSAN bootstrap task')
         var deferred = $q.defer();

         getVsanService().then(function(service) {
            service.api.vsanVcsaGetBootstrapProgress(service.deploySystemRef, [taskId]).then(function(taskProgress) {
               deferred.resolve(taskProgress);
            });
         });

         return deferred.promise;
      };

      /**
       * Track vsan bootstrap task progress, will resolve true if task completes, or false if task failed or timeout
       * @param taskId
       * @returns {*}
       */
      var trackVsanBootstrapStatus = function(taskId) {
         var deferred = $q.defer();
         var duration = 5000;
         var trick = function() {
            getVsanBootstrapTaskProgress(taskId).then(function (progressList) {
               var vbtp = progressList.length > 0 ? progressList[0] : null;
               $log.debug(vbtp);

               if (vbtp) {
                  if (vbtp.error) {
                     $log.error(vbtp.error);
                     deferred.reject(vbtp.error);
                     return;
                  }

                  if (vbtp.progressPct < 100) {
                     $timeout(trick, duration);
                  } else {
                     deferred.resolve(vbtp.success);
                  }
               } else {
                  deferred.resolve(false);
               }
            });
         };

         trick();

         return deferred.promise;
      };

      this.getVcsaDeploymentTasks = function() {
         $log.debug('attempting to get VCSA deployment tasks');
         var deferred = $q.defer();

         getVsanService().then(function (service) {
            service.api.vsanVcsaGetBootstrapTasks(service.deploySystemRef).then(function (results) {
               var taskMap = {};
               var taskArr = results ? results.map(function (task) {
                  taskMap[task.taskId.toString()] = {
                     vmName: task.vmName,
                     taskId: task.taskId
                  };

                  return taskMap[task.taskId.toString()];
               }) : [];

               if (taskArr.length > 0) {
                  service.api.vsanVcsaGetBootstrapProgress(service.deploySystemRef, taskArr.map(function (task) {
                     return task.taskId;
                  })).then(function(taskProgresses) {
                     angular.forEach(taskProgresses, function(taskProgress) {
                        var curTask = taskMap[taskProgress.taskId];
                        curTask.phase = taskProgress.phase;
                        curTask.progress = taskProgress.progressPct;
                        curTask.message = taskProgress.message;
                        curTask.success = taskProgress.success;
                        curTask.error = taskProgress.error ? taskProgress.error.fault.faultMessage[0].message : undefined;
                        curTask.updateCounter = taskProgress.updateCounter;
                     });
                     deferred.resolve(taskArr);
                  }, function(error) {
                     $log.error('Faild to get progress of tasks', error);
                     deferred.reject(error);
                  });
               } else {
                  deferred.resolve(taskArr);
               }

            }, function(error) {
               deferred.reject(error);
            });
         }, function (error) {
            deferred.reject(error);
         });

         return deferred.promise;
      };

      var getVsanDatastore = function() {
         var deferred = $q.defer();

         VIMService.getDatastores().then(function(datastores) {
            var vsanDatastore;
            datastores.forEach(function (datastore) {
               if (datastore.summary.type === VsanConstant.TYPE_VSAN_DATASTORE) {
                  vsanDatastore = datastore;
               }
            });

            deferred.resolve(vsanDatastore);
         }, function(error) {
            $log.debug('Failed to get VSAN datastore', error);
            deferred.reject(error);
         });

         return deferred.promise;
      };

      this.getVsanDataStore = getVsanDatastore;

      this.validateDeploymentConfig = function(vcConfigSpec) {
         var deferred = $q.defer();
         getVsanService().then(function(service) {
            var spec = new service.types.VsanVcsaDeploymentSpec(vcConfigSpec);
            service.api.vsanValidateDeploymentConfig(service.deploySystemRef, spec).then(function(deploymentValidationSpecResult) {
               deferred.resolve(deploymentValidationSpecResult);
            }, function(error) {
               $log.error('Fail to validate vc config', error);
               deferred.reject(error);
            });
         });
         return deferred.promise;
      };

      /**
       * Bootstrap VCSA onto VSAN, this method warps several APIs call:
       * 1. it will enable VSAN on host;
       * 2. It will claim all disks for VSAN datastore;
       * 3. Upload OVA file to VSAN datastore;
       * 4. Deploy VCSA
       * @param rawSpec the raw VsanVcsaDeploymentSpec
       * @param ovaFile the file user selects to upload to VSAN datastore
       * @returns Promise
       */
      this.vcsaBootstrapOntoVsan = function(rawSpec, ovaFile, isVsanEnabled, vsanDatastore) {
         $log.debug('VcsaBootstrapOntoVsan begins');
         var deferred = $q.defer();
         var promise = isVsanEnabled ? $q.resolve(true) : enableVsan();
         var filePathOnDs;
         var datastoreName;
         var dirname = VsanConstant.OVA_UPLOAD_DIR;

         //Needs to bootstrap VSAN very time, in case we need to claim disk for vsan
         rawSpec.vsanBootstrapOnly = true;

         promise.then(function () {
            getVsanService().then(function (service) {
               var ManagedObjectReference = service.types['ManagedObjectReference'];
               vcsaBootstrapInternal(rawSpec, service).then(function (taskId) {
                  trackVsanBootstrapStatus(taskId).then(function (isReady) {
                     if (isReady) {
                        var dsPromise = vsanDatastore ? $q.resolve(vsanDatastore) : getVsanDatastore();
                        dsPromise.then(function (datastore) {
                           var moref = new ManagedObjectReference({
                              type: VsanConstant.MOR_TYPE_DATASTORE,
                              value: datastore._moid
                           });
                           datastoreName = datastore.summary.name;
                           VIMService.makeDirectoryViaDsNsMgrIfNotExist(
                              moref, dirname, VsanConstant.SINGLE_NODE_VSAN_POLICY_STRING).then(function () {
                              filePathOnDs = [dirname, '/', ovaFile.name].join('');
                              StorageService.uploadToDatastore(
                                 datastoreName, filePathOnDs, ovaFile, function (progress) {}).then(function () {
                                 rawSpec.vcsaOvaPath = ['[', datastoreName, '] ', filePathOnDs].join('');
                                 rawSpec.vsanBootstrapOnly = false;
                                 //Set disk mapping creation spec to null to avoid disk validation which will cause unsupported disk exception
                                 rawSpec.vsanDiskMappingCreationSpec = null;
                                 vcsaBootstrapInternal(rawSpec, service).then(function (taskId) {
                                    deferred.resolve(taskId);
                                 }, function (error) {
                                    $log.error('Failed to bootstrap VCSA', error);
                                    deferred.reject(error);
                                 });
                              });
                           }, function (error) {
                              $log.error('Failed to create directory', error);
                              deferred.reject(error);
                           })
                        }, function (error) {
                           $log.error('Failed to get VSAN datastore', error);
                           deferred.reject(error);
                        });
                     } else {
                        $log.error('VSAN bootstrap task failed', isReady);
                        deferred.reject(new Error(isReady));
                     }
                  }, function (error) {
                     $log.error('Failed to track VSAN bootstrap task progress', error);
                     deferred.reject(error);
                  });
               }, function (error) {
                  $log.error('Failed to bootstrap VSAN', error);
                  deferred.reject(error);
               });
            }, function (error) {
               $log.error('Failed to get VSAN service', error);
               deferred.reject(error);
            });
         }, function (error) {
            $log.error('Failed to enable VSAN', error);
            deferred.reject(error);
         });

         return deferred.promise;
      };
   };
});
