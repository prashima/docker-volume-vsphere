define(['angular'], function(angular) {
   'use strict';

   return function($log, $scope, DvolService, DialogService, WizardService) {
      $log = $log.getInstance('DvolTabTwoController', true);
      $log.debug('In dvol tab two controller global scope');

      var testButtonTwo = {
         id: 'testButtonTwo',
         label: 'Test button two',
         tooltipText: 'Test tooltip',
         enabled: true,
         iconClass: 'esx-icon-vm-console',
         onClick: function () {
            DialogService.showDialog('dvol.about', {
               test: 'test'
            });
         }
      };

      var testButtonThree = {
         id: 'testButtonThree',
         label: 'Test button three',
         tooltipText: 'Test tooltip',
         enabled: true,
         iconClass: 'esx-icon-new-vm',
         onClick: function () {
            WizardService.showWizard('dvol.wizard');
         }
      };

      $scope.actionBar = {
         actions: [
            testButtonTwo,
            testButtonThree
         ]
      };
   };
});
