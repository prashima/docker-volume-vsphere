/* global define */

define(['angular'], function() {
  'use strict';

  return function() {

    var __mockTenants = [
      ['692c1e66-a3f4-4322-a4fb-85276659c9b9', 'my-dummy-tenant-1',
        'I created this as an example'
      ],
      ['1e758b16-6f4d-4155-994d-f966f1805115', 'my-dummy-tenant-2',
        'Another example tenant'
      ],
      ['b2303090-80e5-4efb-b2ea-763b86bd2d8b', 'my-dummy-tenant-3',
        'This is one of my favorite test tenants'
      ]
      // ['e0422589-7ae8-4651-abdf-12cecdd41cce', 'my-dummy-tenant-3', 'This is one of my favorite test tenants'],
      // ['692c1e66-a3f4-4322-a4fb-85276659c9b9', 'my-dummy-tenant-1', 'I created this as an example'],
      // ['1e758b16-6f4d-4155-994d-f966f1805115', 'my-dummy-tenant-2', 'Another example tenant'],
      // ['b2303090-80e5-4efb-b2ea-763b86bd2d8b', 'my-dummy-tenant-3', 'This is one of my favorite test tenants'],
      // ['e0422589-7ae8-4651-abdf-12cecdd41cce', 'my-dummy-tenant-3', 'This is one of my favorite test tenants']
    ];

    this.tenants = __mockTenants;

  };

});
