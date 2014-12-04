'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MyParadropCtrl
 * @description
 * # MyParadropCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MyParadropCtrl', ['$scope', 'USER_ROLES', '$location', function ($scope, USER_ROLES, $location) {
    $scope.authorizedRoles = [ USER_ROLES.admin, USER_ROLES.editor ];

    //FIXME -- authenticated pages
    /*
    if (!$scope.currentUser)
    {
      $location.url('/login');
    }
    */
  }]);
