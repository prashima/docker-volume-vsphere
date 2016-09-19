/* global define */

define([], function() {
  'use strict';

  return function($q) {

    function get() {
      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        d.resolve(tenants);
      }, 200);
      return d.promise;
    }

    //
    // implement add, delete
    //

    this.get = get;

  };

});
