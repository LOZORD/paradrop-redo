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
  .controller('ApplicationCtrl', ['$scope', '$location', 'USER_ROLES', 'AuthService', '$rootScope', 'ipCookie',
    function ($scope, $location, USER_ROLES, AuthService, $rootScope, ipCookie) {
      //$scope.currentUser = null;

      $scope.userRoles = USER_ROLES;
      $scope.isAuthenticated = AuthService.isAuthenticated;
      $scope.isAuthorized = AuthService.isAuthorized;

      $scope.setCurrentUser = function (user) {
        $rootScope.currentUser = user;
        $rootScope.sessionToken = ipCookie('sessionToken');
      };

      $scope.logout = function () {
        $scope.currentUser.destroy();
        $location.url('/');
      };

      $scope.isLoginPage = ($location.path().indexOf('/login') !== -1);
    }
  ]);
