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
        var credentials = { sessionToken: $scope.currentUser.id, startts: 1419175301 /*new Date().getTime() / 1000 - 86400*/, stopts: new Date().getTime() / 1000 };
        var groupURL = URLS.current + 'recon/data/get/State Street';
        $http.post(groupURL, credentials).then(
          function(json){
            $scope.metaData = json.data;
          }
        );
      }
    );
  });
