'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ChuteCtrl
 * @description
 * # ChuteCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ChuteCtrl', ['$scope', '$http', 'URLS', '$routeParams', '$location',
    function ($scope, $http, URLS, $routeParams, $location) {
    $scope.authorizePage()
    .then(function(isAuthorized) {
      if (isAuthorized) {
        //first get the chutes for this user

        var chuteListURL = /*'https://dbapi.paradrop.io/v1/'*/ URLS.current + 'ap/chute/list';

        $scope.apid = $routeParams.apid;
        var chuteListPayload = {
          sessionToken: $scope.currentUser().id,
          apid: $scope.apid
        };

        $scope.chutes = null;
        $scope.specificChute = null;

        //console.log(chuteListPayload);

        $http.post(chuteListURL, chuteListPayload)
        .then(
          function(chuteList) {
            //console.log('cl',chuteList);
            $scope.chutes = chuteList.data;
            if ($routeParams.chuteid) {
              var ind;

              //console.log('blarg',$routeParams.chuteid);

              for (var chuteInd in $scope.chutes) {
                //console.log('ack',$scope.chutes[chuteInd]);
                if ($scope.chutes[chuteInd].chuteid === $routeParams.chuteid) {
                  //console.log($scope.chutes[chuteInd]);
                  $scope.specificChute = $scope.chutes[chuteInd];
                }
              }

              console.log('sp',$scope.specificChute);

              //config is a string, let's decode and parse it

              var decodedConfig = decodeURIComponent($scope.specificChute.config);
              console.log(decodedConfig);
              var configObj = JSON.parse(decodedConfig);
              console.log(configObj);
              $scope.specificChute.config = configObj;

              //if no specific chute is found...
              if (!$scope.specificChute) {
                $location.path('/');
              }
            }
          },
          function () {
            //hard code data for now
            /*
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
            */
          }
        );

        //console.log('rp', $routeParams, $routeParams.chuteid);

        $scope.chuteURLType = function (type) {
          if (type === 'virtnet') {
            return  'vnets';
          }
          else if (type === 'app') {
            return 'apps';
          }
          else if (type === 'lxc') {
            return 'lxcs';
          }
          else {
            //UNKNOWN TYPE!!!
            return '';
          }
        };

      }
      else {
        //TODO
      }
    });
  }]);
