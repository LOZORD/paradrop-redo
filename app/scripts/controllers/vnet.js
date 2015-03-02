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
          'None',
          'PSK',
          'PSK2'
        ];

        $scope.vnetUpdateData = {
          ssid:       null,
          password:   null,
          encryption: null,
          subnet:     null,
          radioid:    null,
          isprimary:  null,
          qosup:      null,
          qosdn:      null
        };

        var vnetFetchDataPayload = {
          sessionToken: $scope.currentUser().id,
          chuteid:      $routeParams.chuteid
        };

        var vnetFetchDataURL = URLS.current + 'ap/chute/network';

        console.log('fetching vnet data',vnetFetchDataPayload);

        $http.post(vnetFetchDataURL, vnetFetchDataPayload)
        .then(
          function (result) {
            console.log('got result!');
            console.log(result);
          },
          function (result) {
            console.log(result);
          }
        );
      }
    });
  }]);
