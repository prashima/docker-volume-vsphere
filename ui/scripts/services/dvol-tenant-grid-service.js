/* global define angular */

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
        field: 'name',
        displayName: 'Name',
        template: function(dataItem) {
          var icon = 'esx-icon-datastore-register';
          return '<div>' + '<i class="' + icon + '"></i>' + dataItem.name + '</div>';
        }
      },
      {
        field: 'description',
        displayName: 'Description',
        template: function(dataItem) {
          if (angular.isDefined(dataItem.description)) {
            return dataItem.description;
          }
          return '';
        }
      },
      {
        field: 'id',
        displayName: 'ID'
      }
    ];


    var gridProps = {
      id: 'tenantsGrid',
      idDataField: 'id',
      columnDefs: columnDefs,
      sortMode: vuiConstants.grid.sortMode.SINGLE,
      selectionMode: vuiConstants.grid.selectionMode.SINGLE,
      selectedItems: [],
      data: mapTenantsToGrid([]),
      searchable: true
    };

    function makeTenantsGrid(actions) {

      if (actions) {
        gridProps.actionBarOptions = gridProps.actionBarOptions || {};
        gridProps.actionBarOptions.actions = actions;
      }

      var tenantsGrid = GridUtils.Grid(gridProps);

      function refresh() {
        return DvolTenantService.getAll().then(function(tenants) {
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
