define(['angular'], function(angular) {
   'use strict';

   return function(
      $log, $rootScope, $scope,
      ExampleService, ExampleContextMenuService) {

      // $log = $log.getInstance('ExampleTabOneController', true);
      // $log.debug('In example tab one controller global scope');
      //
      // var actionButton = {
      //    id: 'exampleButton',
      //    label: 'Test button one',
      //    tooltipText: 'Test tooltip',
      //    enabled: true,
      //    iconClass: 'esx-icon-example',
      //    onClick: function (e) {
      //       var button = $(e.currentTarget);
      //       var pos = button.offset();
      //       var height = button.height();
      //       $rootScope.contextMenu.show('example', ['object'], e,
      //          pos.left - 1, pos.top + height + 4);
      //    }
      // };
      //
      // $scope.actionBar = {
      //    actions: [
      //       actionButton
      //    ]
      // };
      var tenants = [
        ["692c1e66-a3f4-4322-a4fb-85276659c9b9", "my-example-tenant-1", "I created this as an example"],
        ["1e758b16-6f4d-4155-994d-f966f1805115", "my-example-tenant-2", "Another example tenant"],
        ["b2303090-80e5-4efb-b2ea-763b86bd2d8b", "my-example-tenant-3", "This is one of my favorite test tenants"],
        ["e0422589-7ae8-4651-abdf-12cecdd41cce", "my-example-tenant-3", "This is one of my favorite test tenants"],
        ["692c1e66-a3f4-4322-a4fb-85276659c9b9", "my-example-tenant-1", "I created this as an example"],
        ["1e758b16-6f4d-4155-994d-f966f1805115", "my-example-tenant-2", "Another example tenant"],
        ["b2303090-80e5-4efb-b2ea-763b86bd2d8b", "my-example-tenant-3", "This is one of my favorite test tenants"],
        ["e0422589-7ae8-4651-abdf-12cecdd41cce", "my-example-tenant-3", "This is one of my favorite test tenants"]
      ];

      var datastores = [
        ["99665316-9a27-46c2-a0ab-92103857c86b", "3GB", "1GB", false, false],
        ["e0422589-7ae8-4651-abdf-12cecdd41cce", "1TB", "250GB", false, true],
      ]

      $scope.tenantsGridSettings = {
        columns: [
          {field:'ID',title:'ID'},//,rowspan:2,width:80,sortable:true}
          {field:'name', title:'name'},
          {field:'description', title:'description-foo'}
        ],
        data: tenants.map(function(row) {
          return {
            ID: row[0],
            name: row[1],
            description: row[2]
          };
        })
      };


      $scope.datastoresGridSettings = {
        singleSelect: true,
        rownumbers: true,
        columns: [
          {field:'ID',title:'ID'},//,rowspan:2,width:80,sortable:true}
          {field:'capacity', title:'Capacity'},
          {field:'availability', title:'Global Availability'},
          {field:'create', title:'Create', editor: { type:'checkbox', options:{ on: true, off: false } } },
          {field:'delete', title:'Delete', editor: { type:'checkbox', options:{ on: true, off: false } } }
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






   };
});
