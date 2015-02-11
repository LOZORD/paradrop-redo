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
  .controller('ApplicationCtrl', ['snapRemote', '$q', '$scope', '$location', 'AuthService', 'DEV_MODE', 'URLS',
    function (snapRemote, $q, $scope, $location, AuthService, DEV_MODE, URLS) {
      $scope.DEV_MODE = DEV_MODE;
      $scope.URL = URLS.current;
      $scope.currentUser = AuthService.getSession;

      //collapse dropdown on page changes
      $scope.$on('$routeChangeStart',
        function(){
          $scope.isCollapsed = true;
        }
      );
      $scope.isAuthenticated = AuthService.isAuthenticated;

      $scope.hasSessionCookie = function() {
        return !!AuthService.getToken();
      };

      $scope.sessionToken = AuthService.getToken;

      $scope.authorizePage = AuthService.authorizePage;

      $scope.logout = AuthService.logout;

      $scope.isLoginPage = ($location.path().indexOf('/login') !== -1);

    }
  ]);
