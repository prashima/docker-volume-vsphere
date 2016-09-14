/* global define $ */

define(['angular'], function() {
  'use strict';

  function getSelectedItemsFromSelectedRows(selectedRows) {
    //
    // TODO
    //
    return selectedRows;
  }

  return function($scope, DialogService, GridUtils, vuiConstants, DvolDatacenterVmService) {

    var vms = DvolDatacenterVmService.datacenterVms;

    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        DialogService.currentDialog().opaque.save($scope.datacenterVmsGrid.selectedItems);
        return true;
      }
    });

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
