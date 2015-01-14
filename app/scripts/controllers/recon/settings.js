'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconSettingsCtrl
 * @description
 * # ReconSettingsCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconSettingsCtrl',['$scope', '$sce', '$routeParams', function ($scope, $sce, $routeParams) {
    $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
    $scope.initCurrentUser.promise
    .then(function(){ $scope.authorizePage();})
    .then(
      function(){
      }
      );
  }]);
