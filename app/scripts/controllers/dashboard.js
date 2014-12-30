'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('DashboardCtrl', function ($scope, $routeParams, $sce, URLS, $http) {
    $scope.initCurrentUser.promise
    .then(function(){ $scope.authorizePage();})
    .then(
      function(){
        $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
        var credentials = { sessionToken: $scope.currentUser.id };
        var groupURL = URLS.current + 'recon/meta/StateStreet';
        $http.post(groupURL, credentials).then(
          function(json){
            $scope.metaData = json.data;
          }
        );
      }
    );
  });
