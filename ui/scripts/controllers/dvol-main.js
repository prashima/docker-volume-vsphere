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
          var selectedTenant = $scope.tenantsGrid.selectedItems[0];
          if (!selectedTenant) return;
          DvolTenantService.remove(selectedTenant.id);
          tenantsGrid.refresh();
        }
      },
      {
        id: 'edit-tenant-button',
        label: 'Edit',
        iconClass: 'vui-icon-action-edit',
        tooltipText: 'Edit Tenant',
        enabled: true,
        onClick: function() {
          DvolTenantService.get($scope.tenantsGrid.selectedItems[0].id)
          .then(function(tenant) {
            DialogService.showDialog('dvol.add-tenant', {
              tenant: tenant,
              editMode: true,
              save: function(newTenant) {
                DvolTenantService.update(newTenant)
                  .then(tenantsGrid.refresh);
              }
            });
          });
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
        console.log('selected tenant watch changed - but updating grid not necessary');
        return;
      }
      vmsGrid.refresh();
      datastoresGrid.refresh();
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

    var datastoresGridActions = [
      {
        id: 'edit-datastore',
        label: 'Edit',
        iconClass: 'vui-icon-action-edit',
        enabled: true,
        onClick: function() {
          //
          // ready to implement datastore edit dialog
          //
          console.log('edit datastore for selected item: ' + $scope.datastoresGrid.selectedItems[0].id);
        }
      },
      {
        id: 'add-datastores-button',
        label: 'Add',
        iconClass: 'vui-icon-action-add',
        tooltipText: 'Add Datastores',
        enabled: true,
        onClick: function() {  // (evt, action)
          DialogService.showDialog('dvol.add-datastores', {
            save: function(selectedDatastoresRows) {
              var selectedTenant = $scope.tenantsGrid.selectedItems[0];
              if (!selectedTenant) return; // TODO: async error
              if (!selectedDatastoresRows) return;
              var selectedDatastoresIds = selectedDatastoresRows.map(function(d) {
                return d.id;
              });
              if (selectedDatastoresIds.length < 1) return;
              DvolTenantService.addDatastores(selectedTenant.id, selectedDatastoresIds)
                .then(tenantsGrid.refresh)
                .then(datastoresGrid.refresh);
            },
            datastoresAlreadyInTenant: $scope.tenantsGrid.selectedItems[0].datastores
          });
        }
      }
    ];

    function filterDatastoresForThisTenant(allDatastores) {
      var selectedTenant = $scope.tenantsGrid.selectedItems[0];
      if (!selectedTenant || !selectedTenant.datastores || selectedTenant.datastores.length === 0) return [];
      var filteredDatastores = allDatastores.filter(function(d) {
        return selectedTenant.datastores.indexOf(d.id || d.moid) >= 0;
      });
      return filteredDatastores;
    }

    var datastoresGrid = DvolDatastoreGridService.makeDatastoresGrid(datastoresGridActions, filterDatastoresForThisTenant);
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
              var selectedTenant = $scope.tenantsGrid.selectedItems[0];
              if (!selectedTenant) return; // TODO: async error
              if (!selectedVmsRows) return;
              var selectedVmsIds = selectedVmsRows.map(function(vm) {
                return vm.moid || vm.id;
              });
              if (selectedVmsIds.length < 1) return;
              DvolTenantService.addVms(selectedTenant.id, selectedVmsIds)
                .then(tenantsGrid.refresh)
                .then(vmsGrid.refresh);
            },
            vmsAlreadyInTenant: $scope.tenantsGrid.selectedItems[0].vms
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
          var selectedTenant = $scope.tenantsGrid.selectedItems[0];
          if (!selectedTenant) return;
          var selectedVm = $scope.vmsGrid.selectedItems[0];
          if (!selectedVm) return;
          //
          // TODO: need to resolve moid vs id issue
          //
          DvolTenantService.removeVm(selectedTenant.id, selectedVm.moid || selectedVm.id)
            .then(tenantsGrid.refresh)  // need to restore user's selection in grid
            .then(vmsGrid.refresh);
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
