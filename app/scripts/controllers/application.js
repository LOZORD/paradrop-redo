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
  .controller('ApplicationCtrl', ['Session', '$q', '$scope', '$location', 'AuthService', 'ipCookie',
    function (Session, $q, $scope, $location, AuthService, ipCookie) {
    $scope.initCurrentUser = $q.defer();
      $scope.restoreSession.promise.then(function(){
        $scope.currentUser = Session;
        $scope.sessionToken = Session.id;
        $scope.initCurrentUser.resolve();
      });
      //$scope.myTEST_TEST = 600;
      $scope.isAuthenticated = AuthService.isAuthenticated;
      $scope.isAuthorized = AuthService.isAuthorized;

      $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
        $scope.sessionToken = ipCookie('sessionToken');
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
