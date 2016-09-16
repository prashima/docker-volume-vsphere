/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, GridUtils, vuiConstants,
    DvolStateService) {

    DvolStateService.vms.get().then(function(vms) {
      $scope.datacenterVmsGrid.data = mapVmsToGrid(vms);
    });

    function mapVmsToGrid(vms) {
      return vms.map(function(vm) {
        return {
          vmName: vm.name,
          guestFullName: vm.guestFullName,
          status: vm.status,
          storageUsageFormatted: vm.storageUsageFormatted
        };
      });
    }

    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        DialogService.currentDialog().opaque.save($scope.datacenterVmsGrid
          .selectedItems);
        return true;
      }
    });

    $scope.datacenterVmsGrid = GridUtils.Grid({
      id: 'datacenterVmsGrid',
      columnDefs: [{
        field: 'id'
      }, {
        displayName: 'Virtual machine',
        field: 'vmName'
          // width: '30%'
      }, {
        displayName: 'Guest',
        field: 'guestFullName'
          // width: '30%'
      }, {
        displayName: 'Status',
        field: 'status'
          // width: '30%'
      }, {
        displayName: 'Storage',
        field: 'storageUsageFormatted'
          // width: '30%'
      }],
      // sortMode: vuiConstants.grid.sortMode.SINGLE,
      selectionMode: vuiConstants.grid.selectionMode.MULTI,
      selectedItems: [],
      data: mapVmsToGrid([])
    });

  };

});
