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
  .controller('ApplicationCtrl', ['$scope', '$location', 'USER_ROLES', 'AuthService',
    function ($scope, $location, USER_ROLES, AuthService) {
      $scope.currentUser = null;

      $scope.userRoles = USER_ROLES;
      $scope.isAuthenticated = AuthService.isAuthenticated;
      $scope.isAuthorized = AuthService.isAuthorized;

      $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
      };

      $scope.logout = function () {
        AuthService.logout()
        .then(
            /* SUCCESSFUL LOGOUT */
            function(result) {
              $location.url('/');
            },
            /* FAILURE LOGOUT */
            function (result) {
              //TODO
              alert('-*- SIGN OUT DID NOT WORK! -*-');
              console.log(result);
            }
        );
      };

      $scope.isLoginPage = ($location.path().indexOf('/login') !== -1);
    }
  ]);
