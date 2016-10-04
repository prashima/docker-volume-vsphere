/* global define */

define([], function() {
  'use strict';

  return function(VIMService, $log, $q, TaskService,
    APPLICATION_EVENTS, vuiConstants, $timeout, NotificationService) {


    // Enable vsan at very beginning of vcsa bootstrap
    // Check if vsan is enabled and if disabled then enable it
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
              $timeout(function() {
                deferred.resolve();
              }, 5000);
              TaskService.removeTaskListener(this, task);
            } else {
              $log.error('update VSAN task:' + result.state.value);
            }
          }, task);
        }, function(error) {
          deferred.reject(error);
        });
      }, function(error) {
        deferred.reject(error);
      });

      return deferred.promise;
    };


    var p = enableVsan();
    p.then(function() {
      console.log('enableVsan resolved');
    }, function(e) {
      console.log('enableVsan rejected: ' + e);
    });

  };

});
