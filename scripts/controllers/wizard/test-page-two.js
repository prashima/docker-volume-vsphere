define(['angular'], function(angular) {
   'use strict';

   return function($log, $scope, vuiConstants) {
      $log = $log.getInstance('DvolWizardTestPageTwoController', true);
      $log.debug('In dvol test wizard controller two global scope');

      $scope.wizardOptions.currentPage.state = vuiConstants.wizard.pageState.INCOMPLETE;

      $scope.wizardOptions.currentPage.onCommit = function () {
         $log.debug('commit');
         $scope.wizardOptions.currentPage.state = vuiConstants.wizard.pageState.COMPLETED;
         return true;
      };
   };
});
