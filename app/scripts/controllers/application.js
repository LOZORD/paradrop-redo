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
  .controller('ApplicationCtrl', ['$q', '$scope', '$location', 'AuthService', 'ipCookie',
    function ($q, $scope, $location, AuthService, ipCookie) {
    $scope.initCurrentUser = $q.defer();
      $scope.restoreSession.promise.then(function(){
        $scope.currentUser = AuthService.getSession();
        $scope.initCurrentUser.resolve();
      });
      //$scope.myTEST_TEST = 600;
      $scope.isAuthenticated = AuthService.isAuthenticated;

      $scope.setCurrentUser = function (user) {
        $scope.currentUser = AuthService.getSession();
      };

      $scope.logout = function () {
        if ($scope.isAuthenticated() || $scope.currentUser)
        {
          AuthService.logout()
          .then(
              /* SUCCESSFUL LOGOUT */
              function(result) {
                $scope.currentUser = null;
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
