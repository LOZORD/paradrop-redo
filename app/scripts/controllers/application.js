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
  .controller('ApplicationCtrl', ['$scope', '$location', 'USER_ROLES', 'AuthService'],
    function ($scope, USER_ROLES, AuthService) {
      $scope.currentUser = null;

      $scope.userRoles = USER_ROLES;
      $scope.isAuthorized = AuthService.isAuthorized;

      $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
      }

      $scope.isLoginPage = ($location.path().indexOf('/login') != -1);
    }
  );
