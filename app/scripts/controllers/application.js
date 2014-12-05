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
  .controller('ApplicationCtrl', ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {
      $scope.currentUser = null;
      //$scope.myTEST_TEST = 600;
      $scope.isAuthenticated = AuthService.isAuthenticated;
      $scope.isAuthorized = AuthService.isAuthorized;

      $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
      };

      $scope.logout = function () {
        if ($scope.isAuthenticated() || currentUser)
        {
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
              }
          );
        }
      };

      $scope.isLoginPage = ($location.path().indexOf('/login') !== -1);
    }
  ]);
