/* global define */

define([], function() {
  'use strict';

  return function(DvolDatacenterVmService, GridUtils, vuiConstants, $filter) {

    var translate = $filter('translate');

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

    function makeStatusColDef() {
      return {
        displayName: translate('vm.list.columns.status'),
        field: 'status',
        width: '15%',
        editable: false,
        autoHighlight: false,
        template: function(dataItem) {
          var state = translate('general.unknown');
          var icon = 'esx-icon-question';

          switch (dataItem.status) {
          case 'normal':
            state = translate('vm.list.status.normal');
            icon = 'esx-icon-vm-status-normal';
            break;
          case 'warning':
            state = translate('vm.list.status.warning');
            icon = 'esx-icon-vm-status-warning';
            break;
          case 'inconsistent':
            state = translate('vm.list.status.inconsistent');
            icon = 'esx-icon-vm-status-warning';
            break;
          case 'info':
            state = translate('vm.list.status.normal');
            icon = 'esx-icon-vm-status-normal';
            break;
          case 'question':
            state = translate('vm.list.status.question');
            icon = 'esx-icon-vm-answer-question';
            break;
          case 'invalid':
            state = translate('vm.list.status.invalid');
            icon = 'esx-icon-vm-status-invalid';
            break;
          }

          return '<div data-moid="' + dataItem.moid + '">' +
            '<i class="' + icon + '"></i>' + state + '</div>';
        }
      };
    }

    var columnDefs = [{
      displayName: 'Virtual Machine',
      field: 'vmName',
      width: '25%'
    }, {
      displayName: 'Guest OS',
      field: 'guestFullName',
      width: '25%'
    },
    makeStatusColDef(), {
      displayName: 'Used space',
      field: 'storageUsageFormatted',
      width: '15%'
    }, {
      field: 'id',
      displayName: 'ID',
      width: '15%'
    }];

    function getGridProps(id, selectionMode) {
      return {
        id: id,
        idDataField: 'id',
        columnDefs: columnDefs,
        sortMode: vuiConstants.grid.sortMode.SINGLE,
        selectionMode: vuiConstants.grid.selectionMode[selectionMode || 'MULTI'],
        selectedItems: [],
        data: mapVmsToGrid([]),
        searchable: true
      };
    }

    function makeVmsGrid(id, actions, filterFn, selectionMode) {

      var datacenterVmsGrid;

      var gridProps = getGridProps(id, selectionMode);

      if (actions) {
        gridProps.actionBarOptions = gridProps.actionBarOptions || {};
        gridProps.actionBarOptions.actions = actions;
      }

      datacenterVmsGrid = GridUtils.Grid(gridProps);

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
