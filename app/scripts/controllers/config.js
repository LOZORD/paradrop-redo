'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ConfigCtrl
 * @description
 * # ConfigCtrl
 * Controller of the paradropApp, nested inside of MyParadropCtrl
 */
angular.module('paradropApp')
  .controller('ConfigCtrl', ['AuthService', '$scope', '$location', 'ipCookie', '$routeParams', 'URLS', '$http',
    function (AuthService, $scope, $location, ipCookie, $routeParams, URLS, $http) {
      $scope.authorizePage()
      .then(function(isAuthorized) {
        if (isAuthorized) {
          //get the aps that this user owns
          $scope.configurableDevices = $scope.currentUser().aps.filter(function (device) {
            return device.type.toLowerCase() === 'owner';
          });

          //console.log($scope.configurableDevices);

          //XXX update later
          var pendingURL = 'http://paradrop.wings.cs.wisc.edu:30330/v1/ap/pendingOperations';
          //'https://dbapi.paradrop.io:30333/v1' + 'ap/pendingOperations';

          pendingURL = URLS.current + 'ap/pendingOperations';

          //console.log($scope.currentUser().id);
          $http.post(pendingURL, { sessionToken: $scope.currentUser().id})
            .then(
              function(pendingDevices) {
                //console.log(pendingDevices);
                $scope.configurableDevices.forEach(function (device) {
                  device.ispending = pendingDevices.hasOwnProperty(device.guid);
                  //console.log(device.name, ' is pending?: ', device.ispending);
                });
              },
              function () {
                //console.log('could not get pending devices');
                //do nothing
              });


          /* UPDATING */
          //if we were routed here for updating a config
          if ($routeParams.cDeviceID) {
            $scope.deviceToUpdate = null;
            $scope.CHANNELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 36, 40, 44, 48, 149, 153, 157, 161, 165];
            //TODO, use http to get default values

            for (var i = 0, len = $scope.configurableDevices.length; i < len; i++) {
              if ($scope.configurableDevices[i].guid === $routeParams.cDeviceID) {
                $scope.deviceToUpdate = $scope.configurableDevices[i];
                break;
              }
            }

            //attempt to get live data
            var radioStateURL = 'http://paradrop.wings.cs.wisc.edu:30330/v1/ap/radioState';
            //URLS.current + 'ap/radioState';

            radioStateURL = URLS.current + 'ap/radioState';

            var radioStatePackage = {
              sessionToken: $scope.currentUser().id,
              apid:         $scope.deviceToUpdate.guid
            };

            $scope.origConfigData = null;

            $http.post(radioStateURL, radioStatePackage)
              .then(
                function (result) {
                  $scope.configUpdateData = angular.copy(result.data[0]);
                  //used for reverting
                  $scope.origConfigData = angular.copy($scope.configUpdateData);
                  $scope.isUsingSlowChannel = $scope.usingSlowChannel($scope.configUpdateData.channel);
                },
                function () {
                  $scope.configUpdateData = {
                    isauto:   1,
                    channel:  1,
                    radioid:  1
                  };
                  //used for reverting
                  $scope.origConfigData = angular.copy($scope.configUpdateData);
                }
              );

            $scope.equalsOrig = function (data) {
              return angular.equals(data, $scope.origConfigData);
            };

            //$scope.origConfigData = angular.copy($scope.configUpdateData);

            //console.log($scope.configUpdateData);
            //console.log('xxx');
            //console.log($scope.origConfigData);

            $scope.submitUpdate = function (data, isValid) {
              if (!isValid) {
                return;
              }

              if (data.isauto) {
                data.channel = 1;
              }

              //XXX I'm not doing anything with radioid

              //console.log($scope.currentUser());
              //console.log($scope.deviceToUpdate);

              var dataPackage = {
                sessionToken: $scope.currentUser().id,
                apid:         $scope.deviceToUpdate.guid,
                payload:      data
              };

              var updateURL = URLS.current + '/ap/vnet/radioChangeRequest';

              $http.post(updateURL, dataPackage).then(
                function (result) {
                  if (result.data === '') {
                    $location.path('/mypdp/configs');
                  }
                  else {
                    window.alert(result.data);
                  }
                },
                function () {
                  window.alert('Could not update config');
                }
              );
            };

            $scope.revertConfig = function () {
              $scope.configUpdateData = angular.copy($scope.origConfigData);
              $scope.configUpdateForm.$setPristine(true);
            };

            $scope.usingSlowChannel = function (val) {
              $scope.isUsingSlowChannel = ((val < 11) && ([1, 6, 11].indexOf(val) === -1));
              return $scope.isUsingSlowChannel;
            };
          }
        }
      });
  }]);
