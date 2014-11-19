'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MyParadropCtrl
 * @description
 * # MyParadropCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MainCtrl', ['$scope', 'USER_ROLES'], function ($scope, USER_ROLES) {
    $scope.authorizedRoles: [ USER_ROLES.admin, USER_ROLES.editor ];
  });
