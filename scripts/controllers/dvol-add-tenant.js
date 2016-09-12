

define(['angular'], function(angular) {
   'use strict';

   var vms = [
      ["692c1e66-a3f4-4322-a4fb-85276659c9b9", "my-dummy-vm-1", "I created this as an example"],
      ["1e758b16-6f4d-4155-994d-f966f1805115", "my-dummy-vm-2", "Another example vm"],
      ["b2303090-80e5-4efb-b2ea-763b86bd2d8b", "my-dummy-vm-3", "This is one of my favorite test vms"],
      ["e0422589-7ae8-4651-abdf-12cecdd41cce", "my-dummy-vm-3", "This is one of my favorite test vms"],
      ["692c1e66-a3f4-4322-a4fb-85276659c9b9", "my-dummy-vm-1", "I created this as an example"],
      ["1e758b16-6f4d-4155-994d-f966f1805115", "my-dummy-vm-2", "Another example vm"],
      ["b2303090-80e5-4efb-b2ea-763b86bd2d8b", "my-dummy-vm-3", "This is one of my favorite test vms"],
      ["e0422589-7ae8-4651-abdf-12cecdd41cce", "my-dummy-vm-3", "This is one of my favorite test vms"]
    ];

   return function($scope, DialogService) {

      $scope.tenant = DialogService.currentDialog().opaque.tenant;

      $scope.datacenterVmsGridSettings = {
         selectionMode: 'MULTI',
         columnDefs: [
           {field:'name', fieldName:'name'},
           {field:'description', fieldName:'description'},
           {field:'ID',fieldName:'ID'}
         ],
         data: vms.map(function(row) {
           return {
             ID: row[0],
             name: row[1],
             description: row[2]
           };
         })
       };

   }

});
