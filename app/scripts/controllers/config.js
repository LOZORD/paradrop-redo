'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ConfigCtrl
 * @description
 * # ConfigCtrl
 * Controller of the paradropApp, nested inside of MyParadropCtrl
 */
angular.module('paradropApp')
  .controller('ConfigCtrl', ['AuthService', '$scope', '$location', 'ipCookie', '$routeParams',
    function (AuthService, $scope, $location, ipCookie, $routeParams) {
      $scope.initCurrentUser.promise.then(function(){$scope.authorizePage();})
      .then(function() {
        //get the aps that this user owns
        $scope.configurableDevices = $scope.currentUser.aps.filter(function (device) {
          return device.type.toLowerCase() === 'owner';
        });
        //if we were routed here for updating a config
        if ($routeParams.cDeviceID) {

          $scope.deviceToUpdate = null;

          $scope.CHANNELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 36, 40, 44, 48, 149, 153, 157, 161, 165];

          //TODO, use http to get default values
          $scope.configUpdateData = {
            mode: 'auto',
            channel: 1
          };

          for (var i = 0, len = $scope.configurableDevices.length; i < len; i++) {
            if ($scope.configurableDevices[i].guid === $routeParams.cDeviceID) {
              $scope.deviceToUpdate = $scope.configurableDevices[i];
              break;
            }
          }

          $scope.submitUpdate = function (data, isValid) {
            if (!isValid) {
              return;
            }
          };

          $scope.usingSlowChannel = function (val) {
            console.log(val);
            var contains =  $scope.CHANNELS.filter(function (i) {
                              return i <= 11;
                            }).indexOf(val) !== -1;

            if (contains) {
              return [1, 6, 11].indexOf(val) === -1;
            }
            else {
              return false;
            }
          };
        }
      });
  }]);
