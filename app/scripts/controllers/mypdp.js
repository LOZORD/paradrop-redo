'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MyParadropCtrl
 * @description
 * # MyParadropCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MyParadropCtrl', ['AuthService', '$scope', '$location', 'ipCookie',
    function (AuthService, $scope, $location, ipCookie) {
      //TODO
      $scope.initCurrentUser.promise.then(function(){
        if (!$scope.isAuthenticated()  || !ipCookie('sessionToken')) {
          $location.url('/login');

          //if the token exists for the client, but it is invalid by the server
          //or by previous (other tab) logout
          if ($scope.isAuthenticated()) {
            $scope.currentUser = null;
            AuthService.destroySession();
          }
        }
        $scope.groups = [1,2,3];

        $scope.groups_map = {
          fakeAp1: 1,
          fakeAp2: 3,
          fakeAp3: 2,
          fakeAp4: 3,
          fakeAp5: 2,
          fakeAp6: 2,
          fakeAp7: 3,
          fakeAp8: 2
        };
      });
    }
  ]);
