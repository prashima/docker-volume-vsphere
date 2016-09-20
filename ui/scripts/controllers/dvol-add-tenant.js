/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolVmGridService) {

    $scope.tenant = DialogService.currentDialog().opaque.tenant;

    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        // add $scope.datacenterVmsGrid.selectedItems to $scope.tenant.vms
        DialogService.currentDialog().opaque.save($scope.tenant, grid.selectedItems);
        return true;
      }
    });

    var grid = DvolVmGridService.makeVmsGrid();

    $scope.datacenterVmsGrid = grid.grid;

    $scope.$watch('datacenterVmsGrid.selectedItems', function(newSelected, oldSelected) {
      console.log('oldSelected: ' + oldSelected);
      console.log('newSelected: ' + newSelected);
    });

  };

});
