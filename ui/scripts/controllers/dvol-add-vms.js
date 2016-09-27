/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolVmGridService) {

    var vmsAlreadyInTenant = DialogService.currentDialog().opaque.vmsAlreadyInTenant;
    function filterFn(vms) {
      return vms.filter(function(v) {
        return vmsAlreadyInTenant.indexOf(v.moid || v.id) < 0;
      });
    }
    var grid = DvolVmGridService.makeVmsGrid([], filterFn);

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