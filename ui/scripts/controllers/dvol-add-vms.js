/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolVmsGridService) {

    var grid = DvolVmsGridService.makeVmsGrid();

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
