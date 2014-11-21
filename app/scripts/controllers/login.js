'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('LoginCtrl', ['$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService',
    function ($scope, $rootScope, AUTH_EVENTS, AuthService) {
      $scope.credentials = {
        username: '',
        password: '',
        already_hashed: false
      };

      $scope.login = function (credentials) {
        AuthService.login(credentials).then(
          function (user) {
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            $scope.setCurrentUser(user);
          },
          function () {
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
          }
        );
      };

    }
  ]
);
