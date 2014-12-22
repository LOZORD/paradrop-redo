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
  .controller('ApplicationCtrl', ['snapRemote', '$q', '$scope', '$location', 'AuthService', 'ipCookie',
    function (snapRemote, $q, $scope, $location, AuthService, ipCookie) {
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

      $scope.$on('$routeChangeStart', function(next, current){
        //update current user every page change
        $scope.setCurrentUser();
        //check if session still exists(for cases of multiple instances of app)
        if(!ipCookie('sessionToken')){
          AuthService.destroySession();
        }
      });

      $scope.logout = function () {
        if (($scope.isAuthenticated() || $scope.currentUser) && ipCookie('sessionToken'))
        {
          AuthService.logout()
          .then(
              /* SUCCESSFUL LOGOUT */
              function(result) {
                $scope.currentUser = null;
                snapRemote.close();
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
