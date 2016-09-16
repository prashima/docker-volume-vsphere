/* global define */

define([], function() {
  'use strict';

  return function(DvolDatacenterVmService) {

    var vms = {};
    vms.get = DvolDatacenterVmService.get;

    this.vms = vms;

  };

});
