'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('LoginCtrl', ['$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService', '$location',
    function ($scope, $rootScope, AUTH_EVENTS, AuthService, $location) {
      $scope.credentials = {
        "username": '',
        "password": '',
        "already_hashed": false
      };

      $scope.login = function (credentials) {
        AuthService.login(credentials).then(
          function (user) {
            console.log('PIZZAAAA');
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            $scope.setCurrentUser(user);
            //TODO redirect to homepage
            $location.url('/my_paradrop');
          },
          function () {
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
          }
        );
      };
    }
  ]
);
