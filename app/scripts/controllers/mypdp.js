'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MyParadropCtrl
 * @description
 * # MyParadropCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MyParadropCtrl', ['$scope', 'USER_ROLES', '$cookies', function ($scope, USER_ROLES, $cookies) {
    console.log($cookies);
    $scope.sessionToken = $cookies.sessionToken;
    $scope.authorizedRoles = [ USER_ROLES.admin, USER_ROLES.editor ];
  }]);
