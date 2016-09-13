/* global define */

define(['angular'], function() {
  'use strict';

  return function() {

    var __mockDatacenterVms = [{
      name: 'VM 1',
      description: 'More about VM 1'
    }, {
      name: 'VM 2',
      description: 'More about VM 2'
    }];

    this.datacenterVms = __mockDatacenterVms;

  };

});
