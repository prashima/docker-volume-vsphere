
define(['angular'], function (angular) {
   'use strict';

   return function (
      $q,
      $log,
      $filter,
      VIMService,
      ENV) {

      $log = $log.getInstance('DvolDialogService', true);
      $log.debug('In dvol dialog service global scope');

      var translate = $filter('translate');

      this.showDialog = function (dialog, opaque) {
         switch(dialog) {
            case 'dvol.add-tenant':
               return {
                  title: 'Add Tenant'//translate('example.dialogs.about.title'),
                  icon: 'esx-icon-about',
                  width: '585px',
                  height: '280px',
                  content: 'plugins/docker-volume-plugin/views/dvol-add-tenant-dialog.html',
                  objects: {
                     ENV: ENV,
                     esxiVersion: VIMService.getESXVersion(),
                     esxiBuildNumber: VIMService.getESXBuildNumber()
                  },
                  confirmOptions: {
                     label: translate('client.about.close'),
                     onClick: function () {
                        return true;
                     }
                  }
               };
               break;
         }
      };
   };
});
