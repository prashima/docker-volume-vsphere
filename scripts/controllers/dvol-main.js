define(['angular'], function(angular) {
   'use strict';

   return function(
      $rootScope, $scope, $log, $state, $filter, $timeout,
      StorageManager, AuthService, DvolService, vuiConstants) {

      $log = $log.getInstance('DvolMainController', true);
      $log.debug('In dvol main controller global scope');

      var translate = $filter('translate'),
         currentState = $state.current.name;

      $rootScope.mainPanel.icon = 'esx-icon-example';
      $rootScope.mainPanel.title = AuthService.getHostname() + ' - ' +
         translate('dvol.title');

      var pClickFunction = function(event, tab) {
         tab.loaded = true;
         $state.go(tab.state);
         StorageManager.set('dvol_current_state', tab.state);
      }, getSelectedTab = function(state) {
         var selected = 0;
         state = angular.isUndefined(state) ? $state.current.name : state;

         angular.forEach($scope.dvolTabs.tabs, function(value, key) {
            if (value.state === state) {
               selected = key;
               value.loaded = true;
            }
         });

         return selected;
      };

      $scope.tabs = {
         one: {
            label: translate('dvol.tabs.one.label'),
            tooltipText: translate('dvol.tabs.one.tooltip'),
            contentUrl: 'plugins/docker-volume-plugin/views/dvol-tab-one.html',
            onClick: pClickFunction,
            state: 'host.docker-volume-plugin.one'
         },
         two: {
            label: translate('dvol.tabs.two.label'),
            tooltipText: translate('dvol.tabs.two.tooltip'),
            contentUrl: 'plugins/docker-volume-plugin/views/dvol-tab-two.html',
            onClick: pClickFunction,
            state: 'host.docker-volume-plugin.two'
         }
      };

      $scope.dvolTabs = {
         tabs: Object.keys($scope.tabs).map(function (key) {
            return $scope.tabs[key];
         }),
         tabType: vuiConstants.tabs.type.PRIMARY,
         selectedTabIndex: 0
      };

      $timeout(function () {
         if ($state.current.name === 'host.dvol') {
            $log.debug('top-level tab state, getting pre-selected tab');
            currentState = StorageManager.get('dvol_current_state',
               'host.docker-volume-plugin.one');
         }

         if (currentState !== 'host.docker-volume-plugin') {
            $timeout(function () {
               $state.go(currentState);
            });
         }

         var defaultTab = getSelectedTab();
         $scope.dvolTabs.selectedTabIndex = defaultTab;
         $scope.dvolTabs.tabs[defaultTab].loaded = true;

         StorageManager.set('dvol_current_state', currentState);
         $scope.dvolTabs.selectedTabIndex = getSelectedTab(currentState);
      });
   };
});
