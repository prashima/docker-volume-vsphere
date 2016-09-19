/* global define */

define([], function() {
  'use strict';

  return function(DvolDatacenterVmService, GridUtils, vuiConstants) {

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

    var columnDefs = [{
      field: 'id'
    }, {
      displayName: 'Name',
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
    }];

    function makeVmsGrid() {

      var datacenterVmsGrid = GridUtils.Grid({
        id: 'datacenterVmsGrid',
        columnDefs: columnDefs,
        // sortMode: vuiConstants.grid.sortMode.SINGLE,
        selectionMode: vuiConstants.grid.selectionMode.MULTI,
        selectedItems: [],
        data: mapVmsToGrid([])
      });

      function refresh() {
        return DvolDatacenterVmService.get().then(function(vms) {
          datacenterVmsGrid.data = mapVmsToGrid(vms);
        });
      }

      refresh();

      return {
        grid: datacenterVmsGrid,
        refresh: refresh
      };

    }

    this.makeVmsGrid = makeVmsGrid;

  };

});
