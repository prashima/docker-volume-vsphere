/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolVmGridService) {

    var grid = DvolVmGridService.makeVmsGrid();

    $scope.datacenterVmsGrid = grid.grid;

    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        DialogService.currentDialog().opaque.save($scope.datacenterVmsGrid
          .selectedItems);
        return true;
      }
    });

  };

});
