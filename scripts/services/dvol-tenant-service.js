
define(['angular'], function (angular) {
   'use strict';

   return function () {

     var mock__tenants = [
       { name: 'VM 1', description: 'More about VM 1'},
       { name: 'VM 2', description: 'More about VM 2'}
     ];

     this.tenants = mock__tenants;

   };

});
