'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:BlogCtrl
 * @description
 * # BlogCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('BlogCtrl', ['$scope', '$location', '$http', '$routeParams',
    function ($scope, $location, $http, $routeParams) {
      $scope.name = 'Leo';
      $scope.x = 11;
      $scope.y = 3;
    }
  ]);
