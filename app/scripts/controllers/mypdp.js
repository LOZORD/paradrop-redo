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
      $scope.initCurrentUser.promise.then($scope.authorizePage());
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
    }
  ]);
