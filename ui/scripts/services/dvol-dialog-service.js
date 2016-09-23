/* global define */

define([], function() {
  'use strict';

  return function() {

    var rejectOptions = {
      label: 'Cancel',
      onClick: function() {
        return true;
      }
    };

    this.showDialog = function(dialog) {  // (dialog, opaque)
      switch (dialog) {
      case 'dvol.add-tenant':
        return {
          title: 'Add Tenant', // translate('example.dialogs.about.title'),
          width: '585px',
          height: '540px',
          icon: 'esx-icon-add',
          content: 'plugins/docker-volume-plugin/views/dvol-add-tenant-dialog.html',
          rejectOptions: rejectOptions
        };
      case 'dvol.edit-tenant':
        return {
          title: 'Edit Tenant', // translate('example.dialogs.about.title'),
          width: '585px',
          height: '280px',
          icon: 'esx-icon-add',
          content: 'plugins/docker-volume-plugin/views/dvol-add-tenant-dialog.html',
          rejectOptions: rejectOptions
        };
      case 'dvol.add-vms':
        return {
          title: 'Add Virtual Machines', // translate('example.dialogs.about.title'),
          width: '585px',
          height: '280px',
          icon: 'esx-icon-add',
          content: 'plugins/docker-volume-plugin/views/dvol-add-vms-dialog.html',
          rejectOptions: rejectOptions
        };
      case 'dvol.add-datastores':
        return {
          title: 'Add Datastores', // translate('example.dialogs.about.title'),
          width: '585px',
          height: '280px',
          icon: 'esx-icon-add',
          content: 'plugins/docker-volume-plugin/views/dvol-add-datastores-dialog.html',
          rejectOptions: rejectOptions
        };
      default:
        return {};
      }
    };
  };
});
