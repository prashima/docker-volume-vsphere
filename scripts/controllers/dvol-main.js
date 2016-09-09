
define(['angular'], function(angular) {
   'use strict';

   return function(
      $rootScope, $scope, $log, $state, $filter, $timeout,
      StorageManager, AuthService, vuiConstants, DialogService, DvolDatacenterVmService) {

      var translate = $filter('translate');

      $scope.testingDialog = "foo";

      //
      // TODO: move this out into a data service
      //

      var tenants = [
         ["692c1e66-a3f4-4322-a4fb-85276659c9b9", "my-dummy-tenant-1", "I created this as an example"],
         ["1e758b16-6f4d-4155-994d-f966f1805115", "my-dummy-tenant-2", "Another example tenant"],
         ["b2303090-80e5-4efb-b2ea-763b86bd2d8b", "my-dummy-tenant-3", "This is one of my favorite test tenants"],
         ["e0422589-7ae8-4651-abdf-12cecdd41cce", "my-dummy-tenant-3", "This is one of my favorite test tenants"],
         ["692c1e66-a3f4-4322-a4fb-85276659c9b9", "my-dummy-tenant-1", "I created this as an example"],
         ["1e758b16-6f4d-4155-994d-f966f1805115", "my-dummy-tenant-2", "Another example tenant"],
         ["b2303090-80e5-4efb-b2ea-763b86bd2d8b", "my-dummy-tenant-3", "This is one of my favorite test tenants"],
         ["e0422589-7ae8-4651-abdf-12cecdd41cce", "my-dummy-tenant-3", "This is one of my favorite test tenants"]
       ];

       var datastores = [
         ["99665316-9a27-46c2-a0ab-92103857c86b", "3GB", "1GB", false, false],
         ["e0422589-7ae8-4651-abdf-12cecdd41cce", "1TB", "250GB", false, true],
       ]

       var actionButton = {
          id: 'exampleButton',
          label: 'Test button one',
          tooltipText: 'Test tooltip',
          enabled: true,
          iconClass: 'esx-icon-example',
          onClick: function (e) {
             var button = $(e.currentTarget);
             var pos = button.offset();
             var height = button.height();
             $rootScope.contextMenu.show('example', ['object'], e,
                pos.left - 1, pos.top + height + 4);
          }
       };

       $scope.tenantsGridSettings = {
         selectionMode: 'SINGLE',
         actionBarOptions: {
           actions: [
             {
               id: 'add-tenant-button',
               label: 'Add',
               iconClass: 'vui-icon-action-add',
               tooltipText: 'Add Tenant',
               enabled: true,
               onClick: function(evt, action) {
                 DialogService.showDialog('dvol.add-tenant', {
                   vmsGridSettings: $scope.vmsGridSettings
                 });
               }
              //  onClick: function (e) {
              //     var button = $(e.currentTarget);
              //     var pos = button.offset();
              //     var height = button.height();
              //     $rootScope.contextMenu.show('example', ['object'], e,
              //        pos.left - 1, pos.top + height + 4);
              //  }
             },
             {
               id: 'remove-tenant-button',
               label: 'Remove',
               iconClass: 'vui-icon-action-delete',
               tooltipText: 'Remove Tenant',
               enabled: true,
               onClick: function() {alert('yo');}
             },
             {
               id: 'edit-tenant-button',
               label: 'Edit',
               iconClass: 'vui-icon-action-edit',
               tooltipText: 'Edit Tenant',
               enabled: true,
               onClick: function() {alert('yo');}
             },
           ]
         },
         columnDefs: [
           {field:'ID',fieldName:'ID'},
           {field:'name', fieldName:'name'},
           {field:'description', fieldName:'description'}
         ],
         data: tenants.map(function(row) {
           return {
             ID: row[0],
             name: row[1],
             description: row[2]
           };
         })
       };

       //
       // TENANT DETAIL TABS
       //

       var tabClickFunction = function(event, tab) {
          var e = event;
          var t = tab;
          // tab.loaded = true;
          // $state.go(tab.state);
          // StorageManager.set('dvol_current_state', tab.state);
       }

       var tabs = {
          datastores: {
             label: translate('dvol.tenantDetailTabs.datastores.label'),
             tooltipText: translate('dvol.tenantDetailTabs.datastores.tooltip'),
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
          tabs: Object.keys(tabs).map(function (key) {
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

       $scope.datastoresGridSettings = {
         selectionMode: 'SINGLE',
         actionBarOptions: {
           actions: [
             {
               id: 'action3',
               label: 'Edit',
               iconClass: 'vui-icon-action-edit',
               onClick: function() {alert('yo');}
             }
           ]
         },
         columnDefs: [
           {field:'ID',fieldName:'ID'},
           {field:'capacity', fieldName:'Capacity'},
           {field:'availability', fieldName:'Global Availability'},
           {field:'create', fieldName:'Create', editor: { type:'checkbox', options:{ on: true, off: false } } },
           {field:'delete', fieldName:'Delete', editor: { type:'checkbox', options:{ on: true, off: false } }, formatter: function(v,r,i) {
             return '<a style="color:red">' + v + '</a>';
           } }
         ],
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

      $scope.vmsGridSettings = {
         selectionMode: 'SINGLE',
         columnDefs: [
           {field:'ID',fieldName:'ID'},
           {field:'name', fieldName:'name'},
           {field:'description', fieldName:'description'}
         ],
         data: tenants.map(function(row) {
           return {
             ID: row[0],
             name: row[1].replace('tenant', 'virtual-machine'),
             description: row[2].replace('tenant', 'virtual machine')
           };
         })
       };

   };
});
