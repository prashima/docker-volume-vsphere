/* global define */

define([], function() {
  'use strict';

  return function($rootScope, $scope, $log, $state, $filter, $timeout, GridUtils, StorageManager,
    AuthService, vuiConstants, DialogService, DvolTenantGridService, DvolDatastoreGridService,
    DvolVmGridService, DvolTenantService) {

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
            save: function(newTenant, vms) {
              DvolTenantService.add(newTenant, vms)
                .then(tenantsGrid.refresh);
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
    $scope.$watch('tenantsGrid.selectedItems', function(newVal, oldVal) {
      if (
        (newVal[0] === oldVal[0]) ||
        (newVal[0] && oldVal[0] && newVal[0].vms && oldVal[0].vms) && (
          (!newVal[0].vms && !oldVal[0].vms) ||
          (newVal[0].vms.length === 0 && oldVal[0].vms.length === 0)
        )
      ) {
        console.log('vms grid not necessary upon change in selected tenant');
        return;
      }
      vmsGrid.refresh();
    });

    //
    // TENANT DETAIL TABS
    //

    var tabClickFunction = function() {
      // has args evt and tab
      // may not need this
    };

    var tabs = {
      vms: {
        label: translate('dvol.tenantDetailTabs.vms.label'),
        tooltipText: translate('dvol.tenantDetailTabs.vms.tooltip'),
        contentUrl: 'plugins/docker-volume-plugin/views/dvol-vms.html',
        onClick: tabClickFunction
      },
      datastores: {
        label: translate('dvol.tenantDetailTabs.datastores.label'),
        tooltipText: translate(
          'dvol.tenantDetailTabs.datastores.tooltip'),
        contentUrl: 'plugins/docker-volume-plugin/views/dvol-datastores.html',
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

    function filterVmsForThisTenant(allVms) {
      var selectedTenant = $scope.tenantsGrid.selectedItems[0];
      if (!selectedTenant || !selectedTenant.vms || selectedTenant.vms.length === 0) return [];
      var filteredVms = allVms.filter(function(vm) {
        return selectedTenant.vms.indexOf(vm.moid) >= 0;
      });
      return filteredVms;
    }

    var vmsGrid = DvolVmGridService.makeVmsGrid(vmsGridActions, filterVmsForThisTenant);
    $scope.vmsGrid = vmsGrid.grid;

  };
});
