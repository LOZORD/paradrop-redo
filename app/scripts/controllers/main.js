'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MainCtrl', ['$scope', function ($scope) {
    $scope.authorizePage();
  }]);
