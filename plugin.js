
define([
   'angular',
   'plugins/docker-volume-plugin/scripts/controllers/dvol-main.js',
   'plugins/docker-volume-plugin/scripts/controllers/dvol-tab-one.js',
   'plugins/docker-volume-plugin/scripts/controllers/dvol-tab-two.js',
   'plugins/docker-volume-plugin/scripts/controllers/wizard/test-page-one.js',
   'plugins/docker-volume-plugin/scripts/controllers/wizard/test-page-two.js',
   'plugins/docker-volume-plugin/scripts/services/example.js',
   'plugins/docker-volume-plugin/scripts/services/dvol-dialog.js',
   'plugins/docker-volume-plugin/scripts/services/dvol-wizard.js',
   'plugins/docker-volume-plugin/scripts/services/dvol-context-menu.js'
], function(
   angular,
   ExampleMainController,
   ExampleTabOneController,
   ExampleTabTwoController,
   ExampleWizardTestPageOneController,
   ExampleWizardTestPageTwoController,
   ExampleService,
   ExampleDialogService,
   ExampleWizardService,
   ExampleContextMenuService) {

   'use strict';

   return angular.module('esxUiApp.plugins.dvol', [
      'ui.router',
   ]).controller({
      'ExampleMainController': ExampleMainController,
      'ExampleTabOneController': ExampleTabOneController,
      'ExampleTabTwoController': ExampleTabTwoController,
      'ExampleWizardTestPageOneController': ExampleWizardTestPageOneController,
      'ExampleWizardTestPageTwoController': ExampleWizardTestPageTwoController
   }).service({
      'ExampleService': ExampleService,
      'ExampleDialogService': ExampleDialogService,
      'ExampleWizardService': ExampleWizardService,
      'ExampleContextMenuService': ExampleContextMenuService
   }).run(function ($rootScope, $filter, PluginService) {
      var translate = $filter('translate');

      PluginService.register({
         name: 'docker-volume-plugin',
         version: '1.0.0',
         api: '=1.0.0',
         stylesheets: [
            'styles/main.css'
         ],
         contextMenuServices: [
            'ExampleContextMenuService'
         ],
         dialogServices: [
            'ExampleDialogService'
         ],
         wizardServices: [
            'ExampleWizardService'
         ],
         navigator: [{
            title: translate('dvol.menu.title'),
            icon: 'icon-example-menu',
            state: 'host.docker-volume-plugin',
            onContext: function (e) {
               $rootScope.contextMenu.show('dvol', ['object'], e);
            },
            children: [{
               title: translate('dvol.menu.titleChildOne'),
               icon: 'icon-example-menu',
               state: 'host.docker-volume-plugin.one',
               onContext: function (e) {
                  $rootScope.contextMenu.show('dvol', ['object'], e);
               }
            }]
         }],
         states: [{
            name: 'host.docker-volume-plugin',
            options: {
               url: '/docker-volume-plugin',
               views: {
                  'content@host': {
                     controller: 'ExampleMainController',
                     templateUrl: 'plugins/docker-volume-plugin/views/dvol-main.html'
                  }
               }
            }
         }, {
            name: 'host.docker-volume-plugin.one',
            options: {
               url: '/one'
            }
         }, {
            name: 'host.docker-volume-plugin.two',
            options: {
               url: '/two'
            }
         }]
      });
   });
});
