/* global define $ */

define(['angular'], function(angular) {
  'use strict';

  return function($scope, DialogService, GridUtils, vuiConstants,
    DvolDatacenterVmService, VMService, $filter, $sanitize, $rootScope) {

    var vms = DvolDatacenterVmService.datacenterVms;

    var progress = function(percent) {
      console.log('progress update: ' + percent + ' %');
    };

    var realVms;
    var p = VMService.getVMsForList(true, progress);
    p.then(function(sysVms) {
      realVms = sysVms;
      console.log('got vms: ' + JSON.stringify(realVms));
    });


    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        DialogService.currentDialog().opaque.save($scope.datacenterVmsGrid
          .selectedItems);
        return true;
      }
    });


    //
    // FROM esxui
    //

    var gridHeight = 200;
    var columnVisibility = function (field, defaultVisibility) {
      // var vis = StorageManager.get(VM.VM_LIST_COLUMNS_KEY, {});
      // return angular.isDefined(vis[field]) ? vis[field] : defaultVisibility;
      return true;
    };
    var translate = $filter('translate')
    $scope.datacenterVmsGrid = GridUtils.Grid({
      id: 'vmGrid',
      data: vms,
      height: gridHeight + 'px',
      columnDefs: [{
        displayName: translate('vm.list.columns.name'),
        field: 'name',
        editable: false,
        visible: columnVisibility('name', true),
        template: function(dataItem) {
          var href = dataItem.name;
          if (dataItem.moid) {
            if (!dataItem.invalid) {
              href = encodeURI('#/host/vms/' + dataItem.moid);
              href = '<a ng-href="' + href + '">' + $sanitize(
                dataItem.name) + '</a>';
            }
            href = '<div title="' + $sanitize(dataItem.name) +
              '" ng-right-click="showContextMenu(\'vm\', [' +
              dataItem.moid + '], $event)">' + '<i class="' +
              VMUtil.getIcon(dataItem) + '" title="' +
              translate('vm.state.' + dataItem.state) +
              '" style="margin-top: 0 !important;"></i>' +
              href + '</div>';
          }
          return href;
        }
      }, {
        displayName: translate('vm.list.columns.status'),
        field: 'status',
        width: '13%',
        editable: false,
        visible: columnVisibility('status', true),
        template: function(dataItem) {
          var state = translate('general.unknown');
          switch (dataItem.status) {
          case 'normal':
            state = '<i class="esx-icon-vm-status-normal"></i>' +
              translate('vm.list.status.normal');
            break;
          case 'warning':
            state =
              '<i class="esx-icon-vm-status-warning"></i>' +
              translate('vm.list.status.warning');
            break;
          case 'inconsistent':
            state =
              '<i class="esx-icon-vm-status-warning"></i>' +
              translate('vm.list.status.inconsistent');
            break;
          case 'info':
            state = '<i class="esx-icon-vm-status-normal"></i>' +
              translate('vm.list.status.normal');
            break;
          case 'question':
            state =
              '<i class="esx-icon-vm-answer-question"></i>' +
              translate('vm.list.status.question');
            break;
          case 'invalid':
            state =
              '<i class="esx-icon-vm-status-invalid"></i>' +
              translate('vm.list.status.invalid');
            break;
          }
          return '<div ng-right-click="showContextMenu(\'vm\', [' +
            dataItem.moid + '], $event)">' + state + '</div>';
        }
      }, {
        displayName: translate('vm.list.columns.usedSpace'),
        field: 'usedSpace',
        type: 'number',
        width: '13%',
        editable: false,
        visible: columnVisibility('usedSpace', true),
        template: function(dataItem) {
          var space = translate('general.unknown');
          if (dataItem.usedSpace) {
            space = Utils.formatMemory(dataItem.usedSpace);
          }
          return '<div ng-right-click="showContextMenu(\'vm\', [' +
            dataItem.moid + '], $event)">' + space + '</div>';
        }
      }, {
        displayName: translate('vm.list.columns.hostName'),
        field: 'hostName',
        width: '15%',
        editable: false,
        visible: columnVisibility('hostName', true),
        template: function(dataItem) {
          var hostname = translate('general.unknown');
          if (dataItem.hostName) {
            hostname = dataItem.hostName;
          }
          return '<div ng-right-click="showContextMenu(\'vm\', [' +
            dataItem.moid + '], $event)">' + hostname +
            '</div>';
        }
      }, {
        displayName: translate('vm.list.columns.hostCPU'),
        field: 'cpuUsage',
        type: 'number',
        width: '10%',
        editable: false,
        visible: columnVisibility('cpuUsage', true),
        template: function(dataItem) {
          var cpu = '0 ' + translate('units.MHz');
          if (dataItem.cpuUsage) {
            cpu = Utils.formatCPU(dataItem.cpuUsage);
          }
          return '<div ng-right-click="showContextMenu(\'vm\', [' +
            dataItem.moid + '], $event)">' + cpu + '</div>';
        }
      }, {
        displayName: translate('vm.list.columns.hostMemory'),
        field: 'memoryUsage',
        type: 'number',
        width: '10%',
        editable: false,
        visible: columnVisibility('memoryUsage', true),
        template: function(dataItem) {
          var memory = '0 ' + translate('units.MB');
          if (dataItem.memoryUsage && dataItem.memoryUsage >= 0) {
            memory = Utils.formatMemory(dataItem.memoryUsage *
              1024.0 * 1024.0);
          }
          return '<div ng-right-click="showContextMenu(\'vm\', [' +
            dataItem.moid + '], $event)">' + memory + '</div>';
        }
      }, {
        displayName: translate(
          'vm.list.columns.autostartStartOrder'),
        field: 'autostartPowerInfo.startOrder',
        type: 'number',
        width: '10%',
        editable: false,
        visible: columnVisibility('autostartPowerInfo.startOrder',
          false),
        template: function(dataItem) {
          var startOrder = translate('vm.autostart.unset');
          if (angular.isDefined(dataItem.autostartPowerInfo) &&
            dataItem.autostartPowerInfo.startOrder !== -1) {
            startOrder = dataItem.autostartPowerInfo.startOrder;
          }
          return '<div ng-right-click="showContextMenu(\'vm\', [' +
            dataItem.moid + '], $event)">' + startOrder +
            '</div>';
        }
      }, {
        displayName: translate(
          'vm.list.columns.autostartStartDelay'),
        field: 'autostartPowerInfo.startDelay',
        type: 'number',
        width: '8%',
        editable: false,
        visible: columnVisibility('autostartPowerInfo.startDelay',
          false),
        template: function(dataItem) {
          return '<div ng-right-click="showContextMenu(\'vm\', [' +
            dataItem.moid + '], $event)">' + dataItem.autostartPowerInfo
            .startDelay + '</div>';
        }
      }, {
        displayName: translate(
          'vm.list.columns.autostartStopDelay'),
        field: 'autostartPowerInfo.stopDelay',
        type: 'number',
        width: '8%',
        editable: false,
        visible: columnVisibility('autostartPowerInfo.stopDelay',
          false),
        template: function(dataItem) {
          return '<div ng-right-click="showContextMenu(\'vm\', [' +
            dataItem.moid + '], $event)">' + dataItem.autostartPowerInfo
            .stopDelay + '</div>';
        }
      }],
      sortMode: vuiConstants.grid.sortMode.SINGLE,
      selectionMode: vuiConstants.grid.selectionMode.MULTI,
      selectedItems: [],
      actionBarOptions: vmListActionBarOptions,
      idDataField: 'moid',
      editable: true
    });

    GridUtils.addResizeHandle($scope.vmGrid);
    GridUtils.addTooltips($scope.vmGrid);
    GridUtils.headerBind($scope.vmGrid, 'contextmenu', function(e) {
      $rootScope.contextMenu.show('vm.list.columns',
        $scope.vmGrid, e);
    });

    GridUtils.removeDragToSelect();


    //
    //
    //

    $scope.datacenterVmsGrid = GridUtils.Grid({
      id: 'datacenterVmsGrid',
      columnDefs: [{
        field: 'id'
      }, {
        displayName: 'name',
        field: 'name'
          // width: '30%'
      }, {
        displayName: 'description',
        field: 'description'
          // width: '30%'
      }, {
        displayName: 'ID',
        field: 'ID'
          // width: '30%'
      }],
      // sortMode: vuiConstants.grid.sortMode.SINGLE,
      selectionMode: vuiConstants.grid.selectionMode.MULTI,
      selectedItems: [],
      data: vms.map(function(row) {
        return {
          id: row[0],
          ID: row[0],
          name: row[1],
          description: row[2]
        };
      })
    });

  };

});
