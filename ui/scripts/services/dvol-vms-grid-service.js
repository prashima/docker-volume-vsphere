/* global define */

define([], function() {
  'use strict';

  return function(DvolDatacenterVmService, GridUtils, vuiConstants) {

    function mapVmsToGrid(vms) {
      return vms.map(function(vm) {
        return {
          id: vm.moid,
          vmName: vm.name,
          guestFullName: vm.guestFullName,
          status: vm.status,
          storageUsageFormatted: vm.storageUsageFormatted
        };
      });
    }

    var columnDefs = [{
      displayName: 'Name',
      field: 'vmName'
    }, {
      displayName: 'Guest',
      field: 'guestFullName'
    }, {
      displayName: 'Status',
      field: 'status'
    }, {
      displayName: 'Storage',
      field: 'storageUsageFormatted'
    }, {
      field: 'id',
      displayName: 'ID'
    }];

    function getGridProps(selectionMode) {
      return {
        id: 'vmsGrid',
        idDataField: 'id',
        columnDefs: columnDefs,
        sortMode: vuiConstants.grid.sortMode.SINGLE,
        selectionMode: vuiConstants.grid.selectionMode[selectionMode || 'MULTI'],
        selectedItems: [],
        data: mapVmsToGrid([]),
        searchable: true
      };
    }

    function makeVmsGrid(actions, filterFn, selectionMode) {

      var gridProps = getGridProps(selectionMode);

      if (actions) {
        gridProps.actionBarOptions = gridProps.actionBarOptions || {};
        gridProps.actionBarOptions.actions = actions;
      }

      var datacenterVmsGrid = GridUtils.Grid(gridProps);

      function refresh() {
        return DvolDatacenterVmService.get().then(function(vms) {
          datacenterVmsGrid.data = mapVmsToGrid(filterFn ? filterFn(vms) : vms);
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
