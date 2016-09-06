

angular.module('dvol', [])
.controller('TenantsListController', ['$scope', function($scope) {
  $scope.customer = {
    name: 'Naomi',
    address: '1600 Amphitheatre'
  };
}])
.directive('tenantsList', function() {
  return {
    templateUrl: 'tenants-list.html'
  };
});
