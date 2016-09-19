/* global define */

define([], function() {
  'use strict';

  function formatCapacity(rawCap) {
    return String(rawCap * Math.pow(10, -9)).substr(0, 5) + ' GB';
  }

  return function(DvolDatastoreService, GridUtils, vuiConstants) {

    function mapDatastoresToGrid(datastores) {
      return datastores.map(function(datastore) {
        var capacity = formatCapacity(datastore.capacity);
        var freeSpace = formatCapacity(datastore.freeSpace);
        return {
          datastoreName: datastore.name,
          driveType: datastore.driveType,
          capacity: capacity,
          freeSpace: freeSpace,
          type: datastore.type
        };
      });
    }

    var columnDefs = [
      {
        field: 'id'
      },
      {
        field: 'datastoreName',
        displayName: 'Name'
      },
      {
        field: 'driveType',
        displayName: 'Drive Type'
      },
      {
        field: 'type',
        displayName: 'Type'
      },
      {
        field: 'capacity',
        displayName: 'Capacity'
      },
      {
        field: 'freeSpace',
        displayName: 'Free'
      }
    ];


    function makeDatastoresGrid() {

      var actionBarOptions = {
        actions: [{
          id: 'edit-datastore',
          label: 'Edit',
          iconClass: 'vui-icon-action-edit',
          enabled: true,
          onClick: function() {
            //
            // ready to implement datastore edit dialog
            //
            console.log('edit datastore for selected item: ' + datastoresGrid.selectedItems[0].id);
          }
        }]
      };

      var datastoresGrid = GridUtils.Grid({
        id: 'datastoresGrid',
        columnDefs: columnDefs,
        actionBarOptions: actionBarOptions,
        // sortMode: vuiConstants.grid.sortMode.SINGLE,
        selectionMode: vuiConstants.grid.selectionMode.SINGLE,
        selectedItems: [],
        data: mapDatastoresToGrid([])
      });

      function refresh() {
        return DvolDatastoreService.get().then(function(datastores) {
          datastoresGrid.data = mapDatastoresToGrid(datastores);
        });
      }

      refresh();

      return {
        grid: datastoresGrid,
        refresh: refresh
      };

    }

    this.makeDatastoresGrid = makeDatastoresGrid;

  };

});
