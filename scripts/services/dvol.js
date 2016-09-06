define(['angular'], function (angular) {
   'use strict';

   return function ($log) {
      $log = $log.getInstance('DvolService', true);
      $log.debug('In dvol service global scope');

      this.serviceMethod = function () {
         $log.debug('serviceMethod was called');
      };
   };
});
