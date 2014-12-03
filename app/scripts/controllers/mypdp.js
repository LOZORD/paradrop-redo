'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MyParadropCtrl
 * @description
 * # MyParadropCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MyParadropCtrl', ['$scope', 'USER_ROLES', '$location', function ($scope, USER_ROLES,$cookies, $location) {
    console.log($cookies);
    $scope.sessionToken = $cookies.sessionToken;
    $scope.authorizedRoles = [ USER_ROLES.admin, USER_ROLES.editor ];

    //FIXME -- authenticated pages
    /*
    if (!$scope.currentUser)
    {
      $location.url('/login');
    }
    */
  }]);
