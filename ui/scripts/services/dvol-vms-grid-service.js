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

    function getGridProps(selectionMode) {
      return {
        id: 'datacenterVmsGrid',
        columnDefs: columnDefs,
        // sortMode: vuiConstants.grid.sortMode.SINGLE,
        selectionMode: vuiConstants.grid.selectionMode[selectionMode || 'SINGLE'],
        selectedItems: [],
        data: mapVmsToGrid([])
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
