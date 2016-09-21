/* global define */

define([], function() {
  'use strict';

  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  return function($q) {

    function get() {
      var d = $q.defer();
      //
      // will eventually be async, so mocked as such here
      //
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        d.resolve(tenants);
      }, 200);
      return d.promise;
    }

    function add(tenant, vms) {
      var d = $q.defer();
      setTimeout(function() {
        tenant.id = generateId();
        tenant.vms = (vms || []).map(function(vm) {
          return vm.id;
        });
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        tenants.push(tenant);
        localStorage.setItem('tenants', JSON.stringify(tenants));
        d.resolve(tenants);
      }, 200);
      return d.promise;
    }

    //
    // remove
    //

    function remove(tenantId) {
      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        var newTenants = tenants.filter(function(t) {
          return t.id !== tenantId;
        });
        localStorage.setItem('tenants', JSON.stringify(newTenants));
        d.resolve(newTenants);
      }, 200);
      return d.promise;
    }


    this.remove = remove;
    this.get = get;
    this.add = add;

  };

});
