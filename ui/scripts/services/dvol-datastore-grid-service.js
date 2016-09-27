/* global define */

define([], function() {
  'use strict';

  function formatCapacity(rawCap) {
    return String(rawCap * Math.pow(10, -9)).substr(0, 5) + ' GB';
  }

  return function(DvolDatastoreService, GridUtils, vuiConstants) {

    function mapDatastoresToGrid(datastores) {
      return datastores.map(function(ds) {
        var datastore = ds;
        var permissions;
        if (ds.datastore) {
          permissions = datastore.permissions;
          datastore = datastore.datastore;
        }
        var capacity = formatCapacity(datastore.capacity);
        var freeSpace = formatCapacity(datastore.freeSpace);
        var colData = {
          id: datastore.moid,
          datastoreName: datastore.name,
          driveType: datastore.driveType,
          capacity: capacity,
          freeSpace: freeSpace,
          type: datastore.type
        };
        if (permissions) {
          Object.keys(permissions).forEach(function(k) {
            colData[k] = permissions[k];
          });
        }
        return colData;
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

    var permColumnDefs = [
      {
        field: 'create',
        displayName: 'Create'
      },
      {
        field: 'mount',
        displayName: 'Mount'
      },
      {
        field: 'remove',
        displayName: 'Remove'
      },
      {
        field: 'maxVolume',
        displayName: 'Max Volume'
      },
      {
        field: 'totalVolume',
        displayName: 'Total volume'
      }
    ];

    var searchConfig = {
      filters: [
        {
          field: 'datastoreName',
          operator: 'contains'
        }
      ],
      placeholder: 'Search'
    };

    function makeDatastoresGrid(actions, filterFn, perms) {

      var showPermissions = perms;

      var actionBarOptions = {
        actions: actions
      };

      var datastoresGrid = GridUtils.Grid({
        id: 'datastoresGrid',
        columnDefs: columnDefs.concat(showPermissions ? permColumnDefs : []),
        actionBarOptions: actionBarOptions,
        selectionMode: vuiConstants.grid.selectionMode.SINGLE,
        selectedItems: [],
        data: mapDatastoresToGrid([])
      });

      GridUtils.addSearch(datastoresGrid, searchConfig);

      function refresh() {
        return DvolDatastoreService.get().then(function(datastores) {
          datastoresGrid.data = mapDatastoresToGrid(filterFn ? filterFn(datastores) : datastores);
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
