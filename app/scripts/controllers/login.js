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

      //console.log(currentUser);

      //redirect to user page if already logged in
      //FIXME
      /*
      if (currentUser !== null)
      {
        console.log('already logged in!');
        //$location.url('/my_paradrop');
      }
      */

      $scope.login = function (credentials) {
        AuthService.login(credentials).then(
          function (user) {
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            //set the currentUser as this user in the ApplicationCtrl scope
            $scope.setCurrentUser(user);
            //then redirect to their homepage
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
