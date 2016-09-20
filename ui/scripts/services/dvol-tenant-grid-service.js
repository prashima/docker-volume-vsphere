/* global define */

define([], function() {
  'use strict';

  return function(DvolTenantService, GridUtils, vuiConstants) {

    function mapTenantsToGrid(tenants) {
      return tenants.map(function(tenant) {
        return tenant;
      });
    }

    var columnDefs = [
      {
        field: 'id'
      },
      {
        field: 'name',
        displayName: 'name'
      },
      {
        field: 'description',
        displayName: 'description'
      }, {
        field: 'ID',
        displayName: 'ID'
      }
    ];

    var gridProps = {
      id: 'tenantsGrid',
      columnDefs: columnDefs,
      // sortMode: vuiConstants.grid.sortMode.SINGLE,
      selectionMode: vuiConstants.grid.selectionMode.MULTI,
      selectedItems: [],
      data: mapTenantsToGrid([])
    };

    function makeTenantsGrid(actions) {

      if (actions) {
        gridProps.actionBarOptions = gridProps.actionBarOptions || {};
        gridProps.actionBarOptions.actions = actions;
      }

      var tenantsGrid = GridUtils.Grid(gridProps);

      function refresh() {
        return DvolTenantService.get().then(function(tenants) {
          tenantsGrid.data = mapTenantsToGrid(tenants);
        });
      }

      refresh();

      return {
        grid: tenantsGrid,
        refresh: refresh
      };

    }

    this.makeTenantsGrid = makeTenantsGrid;

  };

});
