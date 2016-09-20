/* global define */

define([], function() {
  'use strict';

  return function($rootScope, $scope, $log, $state, $filter, $timeout, GridUtils, StorageManager,
    AuthService, vuiConstants, DialogService, DvolTenantGridService, DvolDatastoreGridService,
    DvolVmGridService) {

    var translate = $filter('translate');

    //
    // TENANT GRID
    //

    var tenantGridActions = [
      {
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
      },
      {
        id: 'remove-tenant-button',
        label: 'Remove',
        iconClass: 'vui-icon-action-delete',
        tooltipText: 'Remove Tenant',
        enabled: true,
        onClick: function() {
          alert('yo');
        }
      },
      {
        id: 'edit-tenant-button',
        label: 'Edit',
        iconClass: 'vui-icon-action-edit',
        tooltipText: 'Edit Tenant',
        enabled: true,
        onClick: function() {
          alert('yo');
        }
      }
    ];

    var tenantsGrid = DvolTenantGridService.makeTenantsGrid(tenantGridActions);
    $scope.tenantsGrid = tenantsGrid.grid;

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

    var datastoresGrid = DvolDatastoreGridService.makeDatastoresGrid();
    $scope.datastoresGrid = datastoresGrid.grid;


    //
    // VMS Grid
    //

    var vmsGridActions = [
      {
        id: 'add-vms-button',
        label: 'Add',
        iconClass: 'vui-icon-action-add',
        tooltipText: 'Add Virtual Machines',
        enabled: true,
        onClick: function() {  // (evt, action)
          DialogService.showDialog('dvol.add-vms', {
            save: function(selectedVmsRows) {
              console.log('in save fn for add-vm: ' + selectedVmsRows);
            }
          });
        }
      },
      {
        id: 'remove-vm-button',
        label: 'Remove',
        iconClass: 'vui-icon-action-delete',
        tooltipText: 'Remove Virtual Machine',
        enabled: true,
        onClick: function() {
          alert('are you sure you want to remove VM?');
        }
      }
    ];

    var vmsGrid = DvolVmGridService.makeVmsGrid(vmsGridActions);
    $scope.vmsGrid = vmsGrid.grid;

  };
});
