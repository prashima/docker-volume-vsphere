
define([
   'angular',
   //
   // Controllers
   //
   'plugins/docker-volume-plugin/scripts/controllers/dvol-main.js',
   'plugins/docker-volume-plugin/scripts/controllers/dvol-add-tenant.js',
   //
   // Services
   //
   'plugins/docker-volume-plugin/scripts/services/dvol-context-menu.js',
   'plugins/docker-volume-plugin/scripts/services/dvol-dialog-service.js',
   'plugins/docker-volume-plugin/scripts/services/dvol-datacenter-vm-service.js'
   //
], function(
   angular,
   DvolMainController,
   DvolAddTenantController,
   DvolContextMenuService,
   DvolDialogService,
   DvolDatacenterVmService
 ) {

   'use strict';

   return angular.module('esxUiApp.plugins.dvol', [
      'ui.router',
   ]).controller({
      'DvolMainController': DvolMainController,
      'DvolAddTenantController': DvolAddTenantController
   })
   .service({
      //'DvolService': DvolService,
      'DvolDialogService': DvolDialogService,
      //'DvolWizardService': DvolWizardService,
      'DvolContextMenuService': DvolContextMenuService,
      'DvolDatacenterVmService': DvolDatacenterVmService
   })
   .run(function ($rootScope, $filter, PluginService) {
      var translate = $filter('translate');

      PluginService.register({
         name: 'docker-volume-plugin',
         version: '1.0.0',
         api: '=1.0.0',
         stylesheets: [
            'styles/main.css'
         ],
         contextMenuServices: [
            'DvolContextMenuService'
         ],
         dialogServices: [
           'DvolDialogService'
         ],
         navigator: [{
            title: translate('dvol.menu.title'),
            icon: 'icon-example-menu',
            state: 'host.docker-volume-plugin',
            onContext: function (e) {
               $rootScope.contextMenu.show('dvol', ['object'], e);
            },
            children: [
              {
                title: translate('dvol.menu.titleChildOne'),
                icon: 'icon-example-menu',
                state: 'host.docker-volume-plugin.tenants',
                onContext: function (e) {
                  $rootScope.contextMenu.show('dvol', ['object'], e);
                }
              }
            ]
         }],
         states: [
           {
            name: 'host.docker-volume-plugin',
            options: {
               url: '/docker-volume-plugin',
               views: {
                  'content@host': {
                     controller: 'DvolMainController',
                     templateUrl: 'plugins/docker-volume-plugin/views/dvol-main.html'
                  }
               }
            }
         },
         {
            name: 'host.docker-volume-plugin.tenants',
            options: {
               url: '/tenants'
            }
         }]
      });
   });
});
