/* global define */

define([], function() {
  'use strict';

  return function($rootScope, $scope, $log, $state, $filter, $timeout, GridUtils, StorageManager,
    AuthService, vuiConstants, DialogService, DvolTenantsGridService, DvolDatastoresGridService) {

    var translate = $filter('translate');

    var tenantsGrid = DvolTenantsGridService.makeTenantsGrid();
    $scope.tenantsGrid = tenantsGrid.grid;

    DvolTenantService.tenants;



    // watch here ?

    function getSelectedVmsFromRows(rows) {
      return rows.map(function(row) {
        //
        // TODO: pull this out into a schema defined in only one place
        //
        return {
          id: row.id,
          name: row.name,
          description: row.description
        };
      });
    }

    function getSelectedTenant() {
      return $scope.tenantsGrid.selectedItems[0] || {};
    }

    //
    // TENANT DETAIL TABS
    //

    var tabClickFunction = function() {
      // has args evt and tab
      // may not need this
    };

    var tabs = {
      datastores: {
        label: translate('dvol.tenantDetailTabs.datastores.label'),
        tooltipText: translate(
          'dvol.tenantDetailTabs.datastores.tooltip'),
        contentUrl: 'plugins/docker-volume-plugin/views/dvol-datastores.html',
        onClick: tabClickFunction
      },
      vms: {
        label: translate('dvol.tenantDetailTabs.vms.label'),
        tooltipText: translate('dvol.tenantDetailTabs.vms.tooltip'),
        contentUrl: 'plugins/docker-volume-plugin/views/dvol-vms.html',
        onClick: tabClickFunction
      }
    };

    $scope.tenantDetailTabs = {
      tabs: Object.keys(tabs).map(function(key) {
        return tabs[key];
      }),
      tabType: vuiConstants.tabs.type.PRIMARY,
      selectedTabIndex: 0
    };

    var defaultTabIndex = 0;
    $scope.tenantDetailTabs.selectedTabIndex = defaultTabIndex;
    $scope.tenantDetailTabs.tabs[defaultTabIndex].loaded = true;

    //
    // DATASTORES GRID
    //

    var grid = DvolDatastoresGridService.makeDatastoresGrid();
    $scope.datastoresGrid = grid.grid;


    //
    // VMS Grid
    //

    $scope.VmsGrid = GridUtils.Grid({
      id: 'vmsGrid',
      selectionMode: 'SINGLE',
      columnDefs: [
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
        },
        {
          field: 'ID',
          displayName: 'ID'
        }
      ],
      data: getSelectedTenant().vms ? getSelectedTenant.vms.map(function(row) {
        return {
          id: row[0],
          ID: row[0],
          name: row[1].replace('tenant', 'virtual-machine'),
          description: row[2].replace('tenant', 'virtual machine')
        };
      }) : [],
      actionBarOptions: {
        actions: [{
          id: 'add-vms-button',
          label: 'Add',
          iconClass: 'vui-icon-action-add',
          tooltipText: 'Add Virtual Machines',
          enabled: true,
          onClick: function() {  // (evt, action)
            DialogService.showDialog('dvol.add-vms', {
              save: function(selectedVmsRows) {
                console.log('in save fn for add-vm: ' + selectedVmsRows);
                var selectedVms = getSelectedVmsFromRows(selectedVmsRows);
                // add vms to the selected tenant
                var selectedTenant = getSelectedTenant();
                selectedTenant.vms = selectedTenant.vms || [];
                selectedTenant.vms = selectedTenant.vms.concat(selectedVms);
              }
            });
          }
        }, {
          id: 'remove-vm-button',
          label: 'Remove',
          iconClass: 'vui-icon-action-delete',
          tooltipText: 'Remove Virtual Machine',
          enabled: true,
          onClick: function() {
            alert('are you sure you want to remove VM?');
          }
        }]
      }
    });

  };
});
