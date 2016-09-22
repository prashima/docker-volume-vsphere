/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolVmGridService) {

    $scope.tenant = DialogService.currentDialog().opaque.tenant;
    $scope.editMode = DialogService.currentDialog().opaque.editMode;

    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        // add $scope.datacenterVmsGrid.selectedItems to $scope.tenant.vms
        DialogService.currentDialog().opaque.save($scope.tenant, $scope.datacenterVmsGrid.selectedItems);
        return true;
      }
    });

    var grid = DvolVmGridService.makeVmsGrid([], null, 'MULTI');

    $scope.datacenterVmsGrid = grid.grid;

  };

});
