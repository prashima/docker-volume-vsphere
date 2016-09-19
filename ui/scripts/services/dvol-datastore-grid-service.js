/* global define */

define([], function() {
  'use strict';

  return function(DvolDatastoreService, GridUtils, vuiConstants) {

    function mapDatastoresToGrid(datastores) {
      return datastores.map(function(datastore) {
        return {
          datastoreName: datastore.name
        };
      });
    }

    var columnDefs = [
      {
        field: 'id'
      },
      {
        field: 'datastoreName',
        displayName: 'Datastore'
      }
    ];

    function makeDatastoresGrid() {

      var datastoresGrid = GridUtils.Grid({
        id: 'datastoresGrid',
        columnDefs: columnDefs,
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
