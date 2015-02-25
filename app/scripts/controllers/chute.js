'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ChuteCtrl
 * @description
 * # ChuteCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ChuteCtrl', ['$scope', '$http', 'URLS', '$routeParams',
    function ($scope, $http, URLS, $routeParams) {
    $scope.authorizePage()
    .then(function(isAuthorized) {
      if (isAuthorized) {
        //first get the chutes for this user

        var chuteListURL = /*'https://dbapi.paradrop.io/v1/'*/ URLS.current + 'ap/chute/list/';

        $scope.apid = $routeParams.apid;
        var chuteListPayload = {
          sessionToken: $scope.currentUser().id,
          apid: $scope.apid
        };

        $scope.chutes = null;

        console.log(chuteListPayload);

        $http.get(chuteListURL, chuteListPayload)
        .then(
          function(chuteList) {
            console.log(chuteList);
          },
          function () {
            //hard code data for now
            $scope.chutes = [
              {
                type: 'app',
                chuteid: 'test1',
                name: 'TestAppChute',
                state: 'running',
                config: {
                  struct: 'stuff here',
                  runtime: 'more stuff here',
                  traffic: 'stuff here',
                  resource: 'stuff here',
                  files: 'even more stuff here'
                }
              },
              {
                type: 'virtnet',
                chuteid: 'test2',
                name: 'TestVNetChuteA',
                state: 'sleeping',
                config: {
                  struct: 'stuff here',
                  runtime: 'more stuff here',
                  traffic: 'stuff here',
                  resource: 'stuff here',
                  files: 'even more stuff here'
                }
              },
              {
                type: 'virtnet',
                chuteid: 'test3',
                name: 'TestAppChuteB',
                state: 'running',
                config: {
                  struct: 'stuff here',
                  runtime: 'more stuff here',
                  traffic: 'stuff here',
                  resource: 'stuff here',
                  files: 'even more stuff here'
                }
              }
            ];
          });
      }
      else {
        //TODO
      }
    });
  }]);
