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
        username:       null,
        password:       null,
        already_hashed: false,
        return_aps:     true
      };

      $scope.login = function (credentials) {
        AuthService.login(credentials, false).then(
          /* SUCCESSFUL LOGIN */
          function (user) {
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            //set the currentUser as this user in the ApplicationCtrl scope
            $scope.setCurrentUser(user);
            //then redirect to their homepage
            $location.url('/my_paradrop');
          },
          /* FAILED LOGIN */
          function () {
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
            alert('-*- BAD LOGIN -*-'); //TODO
          }
        );
      };
    }
  ]
);
