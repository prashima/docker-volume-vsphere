
define(['angular'], function (angular) {
   'use strict';

   return function (
      $q,
      $log,
      $filter) {

      $log = $log.getInstance('DvolDialogService', true);
      $log.debug('In dvol dialog service global scope');

      var translate = $filter('translate');

      this.showDialog = function (dialog, opaque) {
         switch(dialog) {
            case 'dvol.add-tenant':

               return {
                  title: 'Add Tenant',  //translate('example.dialogs.about.title'),
                  width: '585px',
                  height: '280px',
                  icon: 'esx-icon-add',
                  content: 'plugins/docker-volume-plugin/views/dvol-add-tenant-dialog.html',
                  rejectOptions: {
                    label: 'Cancel',
                    onClick: function () {
                      deferred.reject();
                      return true;
                    }
                  },
                  confirmOptions: {
                     label: 'Add',
                     onClick: function () {
                        opaque.save(opaque.tenant);
                        return true;
                     }
                  }
               };
               break;
         }
      };
   };
});
