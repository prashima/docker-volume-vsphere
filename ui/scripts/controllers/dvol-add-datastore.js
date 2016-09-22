/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolDatastoreGridService) {

    var datastoresAlreadyInTenant = DialogService.currentDialog().opaque.datastoresAlreadyInTenant;
    function filterFn(datastores) {
      return datastores.filter(function(d) {
        return datastoresAlreadyInTenant.indexOf(d.id) < 0;
      });
    }
    var grid = DvolDatastoreGridService.makeDatastoreGrid([], filterFn);

    $scope.datastoreGrid = grid.grid;

    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        DialogService.currentDialog().opaque.save($scope.datastoreGrid
          .selectedItems);
        return true;
      }
    });

  };

});
