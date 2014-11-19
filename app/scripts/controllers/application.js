'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ApplicationCtrl
 * @description
 * # ApplicationCtrl
 * Controller of the paradropApp
 * Included in the <body> tag, this controller has global scope
 */
angular.module('paradropApp')
  .controller('ApplicationCtrl', ['$scope', 'USER_ROLES', 'AuthService'], 
    function ($scope, USER_ROLES, AuthService) {
      $scope.currentUser = null;

      $scope.userRoles = USER_ROLES;
      $scope.isAuthorized = AuthService.isAuthorized;

      $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
      }
    }
  );
