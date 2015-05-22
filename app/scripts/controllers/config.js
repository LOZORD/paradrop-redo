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
          if ($routeParams.apName) {
            $scope.apName = $routeParams.apName;
            $scope.deviceToUpdate = null;
            $scope.CHANNELS = [
              //{ value: '2.4Ghz options',  disabled: true },
              { value: 1,       disabled: false },
              { value: 2,       disabled: false },
              { value: 3,       disabled: false },
              { value: 4,       disabled: false },
              { value: 5,       disabled: false },
              { value: 6,       disabled: false },
              { value: 7,       disabled: false },
              { value: 8,       disabled: false },
              { value: 9,       disabled: false },
              { value: 10,      disabled: false },
              { value: 11,      disabled: false },
              //{ value: '5Ghz options',    disabled: true },
              { value: 36,      disabled: false },
              { value: 40,      disabled: false },
              { value: 44,      disabled: false },
              { value: 48,      disabled: false },
              { value: 149,     disabled: false },
              { value: 153,     disabled: false },
              { value: 157,     disabled: false },
              { value: 161,     disabled: false },
              { value: 165,     disabled: false }
            ];

            for (var i = 0, len = $scope.configurableDevices.length; i < len; i++) {
              if ($scope.configurableDevices[i].name === $scope.apName) {
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

            $scope.origConfigData   = null;
            $scope.configUpdateData = null;

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
            //used for reverting
            $scope.origConfigData = angular.copy($scope.configUpdateData);

            $scope.equalsOrig = function (data) {
              if ($scope.origConfigData) {
                var dataEqualsOrig = angular.equals(data, $scope.origConfigData);
                return dataEqualsOrig;
              }
              else {
                return false;
              }
            };

            $scope.$watch('configUpdateData.isauto', function (newValue) {
              if ($scope.configUpdateData) {
                $scope.configUpdateData.isauto = newValue;
                if ($scope.configUpdateForm) {
                  $scope.configUpdateForm.$setDirty(true);
                }
                if ($scope.origConfigData.isauto && newValue !== $scope.origConfigData.isauto) {
                  $scope.configUpdateForm.$setDirty(true);
                }
              }
            });

            $scope.$watch('configUpdateData.channel', function (newValue) {
              if ($scope.configUpdateData) {
                var newChannelNum = parseInt(newValue, 10);
                $scope.configUpdateData.channel = newChannelNum;
              }
            });

            $scope.submitUpdate = function (data, isValid) {
              if (!isValid) {
                return;
              }

              //force channel to 1 if we are in automatic mode
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
                  if (!isNaN(parseInt(result.data, 10))) {
                    $location.path('/my_paradrop/configs');
                  }
                  else {
                    window.alert(result.data);
                  }
                },
                function (err) {
                  window.alert('Could not update config');
                  $scope.log(err);
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
