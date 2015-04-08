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

          var pendingURL = URLS.current + 'ap/pendingOperations';

          $http.post(pendingURL, { sessionToken: $scope.currentUser().id})
            .then(
              function(pendingDevices) {
                $scope.configurableDevices.forEach(function (device) {
                  device.ispending = pendingDevices.hasOwnProperty(device.guid);
                });
              },
              function () {
                //do nothing
              });


          /* UPDATING */
          //if we were routed here for updating a config
          if ($routeParams.cDeviceID) {
            $scope.deviceToUpdate = null;
            $scope.CHANNELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 36, 40, 44, 48, 149, 153, 157, 161, 165];

            for (var i = 0, len = $scope.configurableDevices.length; i < len; i++) {
              if ($scope.configurableDevices[i].guid === $routeParams.cDeviceID) {
                $scope.deviceToUpdate = $scope.configurableDevices[i];
                break;
              }
            }

            //attempt to get live data
            var radioStateURL = URLS.current + 'ap/radioState';

            var radioStatePackage = {
              sessionToken: $scope.currentUser().id,
              apid:         $scope.deviceToUpdate.name
            };

            $scope.origConfigData = null;

            $http.post(radioStateURL, radioStatePackage)
              .then(
                function (result) {
                  if (!result.data[0]) {
                    $scope.configUpdateData = {
                      isauto:   1,
                      channel:  1,
                      radioid:  1
                    };
                  }
                  else {
                    $scope.configUpdateData = angular.copy(result.data[0]);
                  }

                  //used for reverting
                  $scope.origConfigData = angular.copy($scope.configUpdateData);
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

            $scope.submitUpdate = function (data, isValid) {
              if (!isValid) {
                return;
              }

              if (data.isauto) {
                data.channel = 1;
              }

              //XXX I'm not doing anything with radioid

              var dataPackage = {
                sessionToken: $scope.currentUser().id,
                apid:         $scope.deviceToUpdate.name,
                payload:      data
              };

              var updateURL = URLS.current + 'ap/vnet/radioChangeRequest';

              $http.post(updateURL, dataPackage).then(
                function (result) {
                  if (result.data === '') {
                    $location.path('/my_paradrop/configs');
                  }
                  else {
                    window.alert(result.data);
                  }
                },
                function (err) {
                  window.alert('Could not update config');
                  console.log(err);
                }
              );
            };

            $scope.revertConfig = function () {
              $scope.configUpdateData = angular.copy($scope.origConfigData);
              $scope.configUpdateForm.$setPristine(true);
            };

            $scope.usingSlowChannel = function (val) {
              return (val < 11) && (val !== 1) && (val !== 6);
            };
          }
        }
      });
  }]);
