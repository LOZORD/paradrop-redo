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
        $scope.vnetToUpdate = $scope.specificChute;

        //FIXME in the view
        $scope.ENCRYPTION_TYPES = [
          'NONE',
          'PSK',
          'PSK2'
        ];

        /*
        console.log($scope);
        console.log($rootScope);
        */

        $scope.vnetUpdateData = {
          ssid:         null,
          password:     null,
          confirmation: null,
          encryption:   null,
          subnet:       null,
          radioid:      null,
          isprimary:    null,
          qosup:        null,
          qosdn:        null
        };

        $scope.pristineVNet = angular.copy($scope.vnetUpdateData);

        var vnetFetchDataPayload = {
          sessionToken: $scope.currentUser().id,
          chuteid:      $routeParams.chuteid
        };

        var vnetFetchDataURL = URLS.current + 'ap/chute/network';

        //console.log('fetching vnet data',vnetFetchDataPayload);

        //TODO change this into something neater, ie not copypasta
        /*
        $scope.equals = function (a,b) {
          return angular.equals(a,b);
        };
        */

        $scope.equals = angular.noop;

        $scope.revert = function (origData) {
          $scope.vnetUpdateData = angular.copy(origData);
          $scope.vnetUpdateForm.$setPristine(true);
        };

        $http.post(vnetFetchDataURL, vnetFetchDataPayload)
        .then(
          function (result) {
            //console.log('got result!');
            console.log(result);
            var vnetConfig = JSON.parse(decodeURIComponent(result.data.config));
            console.log(vnetConfig);
            $scope.vnetUpdateData = {
              ssid:           vnetConfig.ssid,
              password:       vnetConfig.passwd || '',
              confirmation:   vnetConfig.passwd || '',
              encryption:     vnetConfig.encryption.toUpperCase() || 'NONE',
              subnet:         vnetConfig.subnet,
              radioid:        result.data.radioid,
              isprimary:      result.data.isprimary || 0,
              qosup:          vnetConfig.qosup,
              qosdn:          vnetConfig.qosdown
            };

            $scope.pristineVNet = angular.copy($scope.vnetUpdateData);

            $scope.equals = function (newData) {
              //console.log('new data is', newData);
              var ret = angular.equals(newData, $scope.pristineVNet);
              //console.log('ret is', ret);
              return ret;
            };

            //console.log('GOT DATA', $scope.vnetUpdateData);
          },
          function (result) {
            console.log(result, 'redirecting due to error');
            $location.url('#!/my_paradrop');
          }
        );
      }
    });
  }]);
