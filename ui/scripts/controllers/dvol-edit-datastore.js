
/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService) {

    $scope.datastore = DialogService.currentDialog().opaque.datastore;

    DialogService.setConfirmOptions({
      label: $scope.editMode ? 'Save' : 'Add',
      onClick: function() {
        DialogService.currentDialog().opaque.save($scope.datastore);
        return true;
      }
    });

  };

});
