/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolVmGridService) {

    $scope.tenant = DialogService.currentDialog().opaque.tenant;

    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        // add $scope.datacenterVmsGrid.selectedItems to $scope.tenant.vms
        DialogService.currentDialog().opaque.save($scope.tenant, $scope.datacenterVmsGrid.selectedItems);
        return true;
      }
    });

    var grid = DvolVmGridService.makeVmsGrid(undefined, undefined, 'MULTI');

    $scope.datacenterVmsGrid = grid.grid;

  };

});
