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

    function makeTenantsGrid(actionHandlers) {

      //
      // need to make these passed in from outside
      //

      // actionHandlers = {
      //   edit:
      //   add:
      //   remove:
      // }

      var actionBarOptions = {
        actions: [{
          id: 'add-tenant-button',
          label: 'Add',
          iconClass: 'vui-icon-action-add',
          tooltipText: 'Add Tenant',
          enabled: true,
          onClick: function() {  // has 1st param evt and also has 2nd param action
            DialogService.showDialog('dvol.add-tenant', {
              tenant: {},
              save: function(newTenant) {
                //
                // TODO: refactor, this is confusing
                //
                $scope.tenantsGrid.data = $scope.tenantsGrid
                  .data.concat({
                    name: newTenant.name,
                    description: newTenant.description,
                    ID: 'generate UUID here'
                  });
              }
            });
          }
        }, {
          id: 'remove-tenant-button',
          label: 'Remove',
          iconClass: 'vui-icon-action-delete',
          tooltipText: 'Remove Tenant',
          enabled: true,
          onClick: function() {
            alert('yo');
          }
        }, {
          id: 'edit-tenant-button',
          label: 'Edit',
          iconClass: 'vui-icon-action-edit',
          tooltipText: 'Edit Tenant',
          enabled: true,
          onClick: function() {
            alert('yo');
          }
        }]
      };

      var tenantsGrid = GridUtils.Grid({
        id: 'tenantsGrid',
        columnDefs: columnDefs,
        actionBarOptions: actionBarOptions,
        // sortMode: vuiConstants.grid.sortMode.SINGLE,
        selectionMode: vuiConstants.grid.selectionMode.MULTI,
        selectedItems: [],
        data: mapTenantsToGrid([])
      });

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
