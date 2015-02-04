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
  .controller('ApplicationCtrl', ['snapRemote', '$q', '$scope', '$location', 'AuthService', 'ipCookie', 'DEV_MODE', 'URLS',
    function (snapRemote, $q, $scope, $location, AuthService, ipCookie, DEV_MODE, URLS) {
    $scope.DEV_MODE = DEV_MODE;
    $scope.URL = URLS.current;
    $scope.initCurrentUser = $q.defer();
      $scope.restoreSession.promise.then(function(){
        $scope.currentUser = AuthService.getSession();
        $scope.initCurrentUser.resolve();
      });

      $scope.isAuthenticated = AuthService.isAuthenticated;

      $scope.hasSessionCookie = function() {
        return !!ipCookie('sessionToken');
      };

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

      $scope.authorizePage = function (shouldBeAdmin)  { 
        if (!$scope.isAuthenticated()  || !ipCookie('sessionToken')) {
          $location.url('/login');

          //if the token exists for the client, but it is invalid by the server
          //or by previous (other tab) logout
          if ($scope.isAuthenticated()) {
            $scope.currentUser = null;
            AuthService.destroySession();
          }
          return;
        }
        if(shouldBeAdmin && !$scope.currentUser.isAdmin){
          $location.url('/my_paradrop');
          alert("You must be an admin to view this page!");
        }
      };

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

      //to attach url changes to buttons
      $scope.go = function (path) {
        console.log(path);
        //$location.url(path);
        //$location.path(path);
      };

    }
  ]);
