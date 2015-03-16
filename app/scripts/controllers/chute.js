'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ChuteCtrl
 * @description
 * # ChuteCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ChuteCtrl', ['$scope', '$http', 'URLS', '$routeParams', '$location', '$rootScope',
    function ($scope, $http, URLS, $routeParams, $location, $rootScope) {
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

        $scope.chutes         = null;
        $rootScope.specificChute  = null;
        $scope.chuteid        = null;

        //console.log(chuteListPayload);

        $http.post(chuteListURL, chuteListPayload)
        .then(
          function(chuteList) {
            //console.log('cl',chuteList);
            $scope.chutes = chuteList.data;

            //don't worry about LXC/lxc's for now

            $scope.chutes = $scope.chutes.filter(function (chute) {
              return chute.type.toLowerCase() != 'lxc';
            });

            if ($routeParams.chuteid) {
              for (var chuteInd in $scope.chutes) {
                if ($scope.chutes[chuteInd].chuteid === $routeParams.chuteid) {
                  $rootScope.specificChute = $scope.chutes[chuteInd];
                }
              }

              if (!$rootScope.specificChute) {
                $location.path('/');
              }

              $scope.chuteid = $rootScope.specificChute.chuteid;

              //config is a string, let's decode and parse it
              var decodedConfig = decodeURIComponent($rootScope.specificChute.config);
              var configObj = JSON.parse(decodedConfig);
              $rootScope.specificChute.config = configObj;

              //if no specific chute is found...
            }
          },
          function () {
          }
        );

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
