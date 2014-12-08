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
  .controller('ApplicationCtrl', ['$scope', '$location', 'USER_ROLES','AUTH_EVENTS', 'AuthService', '$rootScope', 'ipCookie',
    function ($scope, $location, USER_ROLES, AUTH_EVENTS, AuthService, $rootScope, ipCookie) {
      $scope.currentUser = null;
      if(!AuthService.isAuthenticated()){
        //load sessionToken from cookie
        $scope.sessionToken = ipCookie('sessionToken');
        //if they don't have a sessionToken in their cookie don't bother
        if(!$scope.sessionToken){
          return;
        }
        var credentials = {
          sessionToken: ipCookie('sessionToken')
        };
        AuthService.cloneSession(credentials).then(
          /* SUCCESSFUL LOGIN */
          function (user) {
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            //set the currentUser as this user in the ApplicationCtrl scope
            $scope.currentUser = user;
          },
          /* FAILED LOGIN */
          function () {
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
            //then redirect to login?
            //$location.url('/login');
          }
        );
      }

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
