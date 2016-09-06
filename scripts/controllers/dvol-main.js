
define(['angular'], function(angular) {
   'use strict';

   return function(
      $rootScope, $scope, $log, $state, $filter, $timeout,
      StorageManager, AuthService, DvolService, vuiConstants) {

      //
      // Originally from tab one
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

       $scope.tenantsGridSettings = {
         selectionMode: 'SINGLE',
         actionBarOptions: {
           actions: [
             {
               id: 'action1',
               label: 'Add',
               iconClass: 'vui-icon-action-add',
               onClick: function(evt, action) {
                 console.log('add action');
                 alert('yo');
               }
             },
             {
               id: 'action2',
               label: 'Remove',
               iconClass: 'vui-icon-action-delete',
               onClick: function() {alert('yo');}
             },
             {
               id: 'action3',
               label: 'Edit',
               iconClass: 'vui-icon-action-edit',
               onClick: function() {alert('yo');}
             },
             {
               id: 'action4',
               label: 'Copy',
               iconClass: 'vui-icon-action-copy',
               onClick: function() {alert('yo');}
             },
             {
               id: 'action5',
               label: 'Move',
               iconClass: 'vui-icon-action-move',
               onClick: function() {alert('yo');}
             }
           ]
         },
         columnDefs: [
           {field:'ID',fieldName:'ID'},
           {field:'name', fieldName:'name'},
           {field:'description', fieldName:'description-foo'}
         ],
         data: tenants.map(function(row) {
           return {
             ID: row[0],
             name: row[1],
             description: row[2]
           };
         })
       };

       var translate = $filter('translate');

       $scope.datastoresGridSettings = {
         selectionMode: 'SINGLE',
         searchable: {
             messages: {
                 filter: translate("grid.filter"),
                 clear: translate("grid.clear"),
                 info: translate("grid.filterHeader"),
                 isTrue: translate("grid.isTrue"),
                 isFalse: translate("grid.isFalse"),
                 and: translate("grid.and"),
                 or: translate("grid.or")
             },
             operators: {
                 string: {
                     eq: translate("grid.eq"),
                     neq: translate("grid.neq"),
                     startswith: translate("grid.startswith"),
                     contains: translate("grid.contains"),
                     endswith: translate("grid.endswith")
                 },
                 number: {
                     eq: translate("grid.eq"),
                     neq: translate("grid.neq"),
                     gte: translate("grid.gte"),
                     gt: translate("grid.gt"),
                     lte: translate("grid.lte"),
                     lt: translate("grid.lt")
                 },
                 date: {
                     eq: translate("grid.eq"),
                     neq: translate("grid.neq"),
                     gte: translate("grid.gte"),
                     gt: translate("grid.gt"),
                     lte: translate("grid.lte"),
                     lt: translate("grid.lt")
                 }
             }
         },
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
           {field:'ID',fieldName:'ID', searchable:
             {
                 messages: {
                     filter: translate("grid.filter"),
                     clear: translate("grid.clear"),
                     info: translate("grid.filterHeader"),
                     isTrue: translate("grid.isTrue"),
                     isFalse: translate("grid.isFalse"),
                     and: translate("grid.and"),
                     or: translate("grid.or")
                 },
                 operators: {
                     string: {
                         eq: translate("grid.eq"),
                         neq: translate("grid.neq"),
                         startswith: translate("grid.startswith"),
                         contains: translate("grid.contains"),
                         endswith: translate("grid.endswith")
                     },
                     number: {
                         eq: translate("grid.eq"),
                         neq: translate("grid.neq"),
                         gte: translate("grid.gte"),
                         gt: translate("grid.gt"),
                         lte: translate("grid.lte"),
                         lt: translate("grid.lt")
                     },
                     date: {
                         eq: translate("grid.eq"),
                         neq: translate("grid.neq"),
                         gte: translate("grid.gte"),
                         gt: translate("grid.gt"),
                         lte: translate("grid.lte"),
                         lt: translate("grid.lt")
                     }
                 }
             }
           },
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







      //
      // Original main
      //
      //
      // $log = $log.getInstance('DvolMainController', true);
      // $log.debug('In dvol main controller global scope');
      //
      // var translate = $filter('translate'),
      //    currentState = $state.current.name;
      //
      // $rootScope.mainPanel.icon = 'esx-icon-example';
      // $rootScope.mainPanel.title = AuthService.getHostname() + ' - ' +
      //    translate('dvol.title');
      //
      // var pClickFunction = function(event, tab) {
      //    tab.loaded = true;
      //    $state.go(tab.state);
      //    StorageManager.set('dvol_current_state', tab.state);
      // }, getSelectedTab = function(state) {
      //    var selected = 0;
      //    state = angular.isUndefined(state) ? $state.current.name : state;
      //
      //    angular.forEach($scope.dvolTabs.tabs, function(value, key) {
      //       if (value.state === state) {
      //          selected = key;
      //          value.loaded = true;
      //       }
      //    });
      //
      //    return selected;
      // };
      //
      // $scope.tabs = {
      //    one: {
      //       label: translate('dvol.tabs.one.label'),
      //       tooltipText: translate('dvol.tabs.one.tooltip'),
      //       contentUrl: 'plugins/docker-volume-plugin/views/dvol-tab-one.html',
      //       onClick: pClickFunction,
      //       state: 'host.docker-volume-plugin.one'
      //    },
      //    two: {
      //       label: translate('dvol.tabs.two.label'),
      //       tooltipText: translate('dvol.tabs.two.tooltip'),
      //       contentUrl: 'plugins/docker-volume-plugin/views/dvol-tab-two.html',
      //       onClick: pClickFunction,
      //       state: 'host.docker-volume-plugin.two'
      //    }
      // };
      //
      // $scope.dvolTabs = {
      //    tabs: Object.keys($scope.tabs).map(function (key) {
      //       return $scope.tabs[key];
      //    }),
      //    tabType: vuiConstants.tabs.type.PRIMARY,
      //    selectedTabIndex: 0
      // };
      //
      // $timeout(function () {
      //    if ($state.current.name === 'host.dvol') {
      //       $log.debug('top-level tab state, getting pre-selected tab');
      //       currentState = StorageManager.get('dvol_current_state',
      //          'host.docker-volume-plugin.one');
      //    }
      //
      //    if (currentState !== 'host.docker-volume-plugin') {
      //       $timeout(function () {
      //          $state.go(currentState);
      //       });
      //    }
      //
      //    var defaultTab = getSelectedTab();
      //    $scope.dvolTabs.selectedTabIndex = defaultTab;
      //    $scope.dvolTabs.tabs[defaultTab].loaded = true;
      //
      //    StorageManager.set('dvol_current_state', currentState);
      //    $scope.dvolTabs.selectedTabIndex = getSelectedTab(currentState);
      });
   };
});
