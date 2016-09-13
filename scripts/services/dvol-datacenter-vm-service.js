define(['angular'], function(angular) {
  'use strict';

  return function() {

    var mock__datacenterVms = [{
      name: 'VM 1',
      description: 'More about VM 1'
    }, {
      name: 'VM 2',
      description: 'More about VM 2'
    }];

    this.datacenterVms = mock__datacenterVms;

  };

});
