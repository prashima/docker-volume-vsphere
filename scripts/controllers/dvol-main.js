/* global define */

define(['angular'], function() {
  'use strict';

  return function($rootScope, $scope, $log, $state, $filter, $timeout,
    GridUtils,
    StorageManager, AuthService, vuiConstants, DialogService,
    DvolTenantService) {

    var translate = $filter('translate');

    var tenants = DvolTenantService.tenants;

    var datastores = [
      ['99665316-9a27-46c2-a0ab-92103857c86b', '3GB', '1GB', false,
        false
      ],
      ['e0422589-7ae8-4651-abdf-12cecdd41cce', '1TB', '250GB', false,
        true
      ]
    ];

    $scope.tenantsGridSettings = {
      selectionMode: 'SINGLE',
      actionBarOptions: {
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
                $scope.tenantsGridSettings.data = $scope.tenantsGridSettings
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
      },
      columnDefs: [
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
      ],
      data: tenants.map(function(row) {
        return {
          name: row[1],
          description: row[2],
          ID: row[0]
        };
      })
    };

    //
    // TENANT DETAIL TABS
    //

    var tabClickFunction = function() {
      // has args evt and tab
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

    //
    // TODO: fix this
    //

    $scope.datastoresGrid = {
      selectionMode: 'SINGLE',
      actionBarOptions: {
        actions: [{
          id: 'action3',
          label: 'Edit',
          iconClass: 'vui-icon-action-edit',
          onClick: function() {
            alert('yo');
          }
        }]
      },
      columnDefs: [{
        field: 'ID',
        displayName: 'ID'
      }, {
        field: 'capacity',
        displayName: 'Capacity'
      }, {
        field: 'availability',
        displayName: 'Global Availability'
      }, {
        field: 'create',
        displayName: 'Create',
        editor: {
          type: 'checkbox',
          options: {
            on: true,
            off: false
          }
        }
      }, {
        field: 'delete',
        displayName: 'Delete',
        editor: {
          type: 'checkbox',
          options: {
            on: true,
            off: false
          }
        },
        formatter: function(v) {  // full args are (v, r, i)
          return '<a style="color:red">' + v + '</a>';
        }
      }],
      data: datastores.map(function(row) {
        return {
          ID: row[0],
          capacity: row[1],
          availability: row[2],
          create: row[3],
          delete: row[4]
        };
      })
    };

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
      data: tenants.map(function(row) {
        return {
          id: row[0],
          ID: row[0],
          name: row[1].replace('tenant', 'virtual-machine'),
          description: row[2].replace('tenant', 'virtual machine')
        };
      }),
      // selectedItem: ??,
      actionBarOptions: {
        actions: [{
          id: 'add-vms-button',
          label: 'Add',
          iconClass: 'vui-icon-action-add',
          tooltipText: 'Add Virtual Machines',
          enabled: true,
          onClick: function() {  // (evt, action)
            DialogService.showDialog('dvol.add-vms', {
              save: function(selectedVms) {
                console.log('in save fn for add-vm: ' + selectedVms);
                  // add vms to the tenant
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
