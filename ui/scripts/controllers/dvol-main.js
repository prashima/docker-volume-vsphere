/* global define */

define([], function() {
  'use strict';

  return function($rootScope, $scope, $log, $state, $filter, $timeout, GridUtils, vuiConstants, DialogService,
    DvolDatastoreService, DvolTenantService, DvolTenantGridService, DvolDatastoreGridService, DvolVmGridService) {

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
          if ($scope.tenantsGrid.selectedItems.length < 1) return;
          DvolTenantService.get($scope.tenantsGrid.selectedItems[0].id)
          .then(function(tenant) {
            DialogService.showDialog('dvol.edit-tenant', {
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
          if ($scope.datastoresGrid.selectedItems.length < 1) return;
          var datastoreId = $scope.datastoresGrid.selectedItems[0];
          //
          // need this ?
          // DvolDatastoreService.get($scope.datastoresGrid.selectedItems[0].id)
          //
          DvolTenantService.get($scope.tenantsGrid.selectedItems[0].id)
          .then(function(tenant) {
            var datastore = tenant.datastores.filter(function(d) {
              return d.id === datastoreId;
            });
            DialogService.showDialog('dvol.edit-datastore', {
              datastore: datastore,
              editMode: true,
              save: function(editedDatastore) {
                DvolTenantService.updateDatastore(tenant.id, editedDatastore)
                  .then(datastoresGrid.refresh);
              }
            });
          });
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
                
                .then(datastoresGrid.refresh);
            },
            datastoresAlreadyInTenant: DvolTenantService.state.tenants[$scope.tenantsGrid.selectedItems[0].id].datastores
          });
        }
      },
      {
        id: 'remove-datastore-button',
        label: 'Remove',
        iconClass: 'vui-icon-action-delete',
        tooltipText: 'Remove Datastore',
        enabled: true,
        onClick: function() {
          var selectedTenant = $scope.tenantsGrid.selectedItems[0];
          if (!selectedTenant) return;
          var selectedDatastore = $scope.datastoresGrid.selectedItems[0];
          if (!selectedDatastore) return;
          DvolTenantService.removeDatastore(selectedTenant.id, selectedDatastore.moid || selectedDatastore.id)
            .then(datastoresGrid.refresh);
        }
      }
    ];

    function filterDatastoresForThisTenant(allDatastores) {
      // NOTE: selectedTenants from the grid doesn't have new datastores added (will not until grid refresh)
      // we don't want to refresh the grid because we'll lose tenant row selection
      var selectedTenantRow = $scope.tenantsGrid.selectedItems[0];
      if (!selectedTenantRow) return [];
      var selectedTenant = DvolTenantService.state.tenants[selectedTenantRow.id];
      var filteredDatastores = allDatastores.filter(function(d) {
        return selectedTenant.datastores[d.id || d.moid];
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
          var selectedTenant = $scope.tenantsGrid.selectedItems[0];
          DialogService.showDialog('dvol.add-vms', {
            save: function(selectedVmsRows) {
              if (!selectedTenant) return; // TODO: async error
              if (!selectedVmsRows) return;
              var selectedVmsIds = selectedVmsRows.map(function(vm) {
                return vm.moid || vm.id;
              });
              if (selectedVmsIds.length < 1) return;
              DvolTenantService.addVms(selectedTenant.id, selectedVmsIds)
                .then(vmsGrid.refresh);
            },
            vmsAlreadyInTenant: DvolTenantService.state.tenants[$scope.tenantsGrid.selectedItems[0].id].vms
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
          DvolTenantService.removeVm(selectedTenant.id, selectedVm.moid || selectedVm.id)
            .then(vmsGrid.refresh);
        }
      }
    ];

    function filterVmsForThisTenant(allVms) {
      // NOTE: selectedTenants from the grid doesn't have new vms added (will not until grid refresh)
      // we don't want to refresh the grid because we'll lose tenant row selection
      var selectedTenantRow = $scope.tenantsGrid.selectedItems[0];
      if (!selectedTenantRow) return [];
      var selectedTenant = DvolTenantService.state.tenants[selectedTenantRow.id];
      var filteredVms = allVms.filter(function(vm) {
        return selectedTenant.vms.indexOf(vm.moid) >= 0;
      });
      return filteredVms;
    }

    var vmsGrid = DvolVmGridService.makeVmsGrid(vmsGridActions, filterVmsForThisTenant);
    $scope.vmsGrid = vmsGrid.grid;

  };
});
