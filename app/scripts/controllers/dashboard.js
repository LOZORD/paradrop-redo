'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('DashboardCtrl', function ($scope, $routeParams, $sce) {
    $scope.initCurrentUser.promise.then($scope.authorizePage()).then(function(){

    $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);

    });
  });
