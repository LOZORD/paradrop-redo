'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:VNetCtrl
 * @description
 * # VNetCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('VNetCtrl', ['$scope', '$http', 'URLS', '$routeParams', '$location',
    function ($scope, $http, URLS, $routeParams, $location) {
    $scope.authorizePage()
    .then(function(isAuthorized) {
      if (isAuthorized) {
        $scope.togglerBtn = false;

        $scope.ENCRYPTION_TYPES = [
          'NONE',
          'PSK',
          'PSK2'
        ];

        $scope.vnetUpdateData = {
          ssid:         null,
          password:     null,
          confirmation: null,
          encryption:   null,
          subnet:       null,
          radioid:      null,
          qosup:        null,
          qosdn:        null
        };

        $scope.pristineVNet = angular.copy($scope.vnetUpdateData);

        var vnetFetchDataPayload = {
          sessionToken: $scope.currentUser().id,
          chuteid:      $routeParams.chuteid
        };

        var vnetFetchDataURL = URLS.current + 'ap/chute/network';

        $scope.equals = angular.noop;

        $scope.revert = function (origData) {
          $scope.vnetUpdateData = angular.copy(origData);
          $scope.vnetUpdateForm.$setPristine(true);
        };

        $http.post(vnetFetchDataURL, vnetFetchDataPayload)
        .then(
          function (result) {
            var vnetConfig = JSON.parse(decodeURIComponent(result.data.config));
            $scope.vnetUpdateData = {
              ssid:           vnetConfig.ssid,
              password:       vnetConfig.passwd || '',
              confirmation:   vnetConfig.passwd || '',
              encryption:     vnetConfig.encryption.toUpperCase() || 'NONE',
              subnet:         vnetConfig.subnet,
              radioid:        result.data.radioid,
              qosup:          vnetConfig.qosup,
              qosdn:          vnetConfig.qosdown
            };

            $scope.pristineVNet = angular.copy($scope.vnetUpdateData);

            $scope.equals = function (newData) {
              return angular.equals(newData, $scope.pristineVNet);
            };
          },
          function () {
            $location.url('/my_paradrop');
          }
        );

        $scope.submitUpdate = function (data, isValid) {
          if (!isValid) {
            console.log('invalid form!');
            console.log($scope.vnetUpdateForm);
            console.log($scope.vnetUpdateForm.$error);
            return;
          }

          var vnetUpdateURL = URLS.current + 'ap/vnet/networkChangeRequest';

          //assuming password === conf, remove conf

          var formattedData = {
            ssid:       data.ssid,
            passwd:     data.password,
            encryption: data.encryption,
            radioid:    data.radioid,
            qosdown:    data.qosdn,
            qosup:      data.qosup,
            subnet:     data.subnet
          };

          //no password if no encryption
          if (formattedData.encryption === 'NONE') {
            formattedData.passwd = '';
          }

          var vnetUpdatePackage = {
            sessionToken: $scope.currentUser().id,
            apid:         $routeParams.apName,
            chuteid:      $routeParams.chuteid,
            payload:      formattedData
          };

          //console.log(vnetUpdatePackage);

          $http.post(vnetUpdateURL, vnetUpdatePackage)
          .then(
            function (result) {
              //success
              if (result.data === '' || !isNaN(parseInt(result.data,10))) {
                $location.path('/my_paradrop/configs/' +  $routeParams.apName + '/chutes/vnets/' + $routeParams.chuteid);
              }
              //failure
              else {
                window.alert('Could not push the update. Please try again.');
              }
            },
            function () {
              window.alert('Could not push the update. Please try again.');
            }
          );
        };
      }
    });
  }]);
