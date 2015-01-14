'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('DashboardCtrl', ['ipCookie', 'chartBuilder', '$q', '$scope', '$routeParams', '$sce', 'URLS', '$http', 'Recon','$rootScope', function (ipCookie, chartBuilder, $q, $scope, $routeParams, $sce, URLS, $http, Recon, $rootScope) {
    $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
    $scope.initCurrentUser.promise
    .then(function(){ $scope.authorizePage();})
    .then(
      function(){
        $scope.apNameMap = {};
        for(var ap in $scope.currentUser.aps){
          $scope.apNameMap[$scope.currentUser.aps[ap].guid] = $scope.currentUser.aps[ap].name;
        }
        var credentials = { sessionToken: ipCookie('sessionToken'), startts: 1419175301 /*new Date().getTime() / 1000 - 86400*/, stopts: new Date().getTime() / 1000 };
        var groupURL = URLS.current + 'recon/data/get/' + $scope.group_id;
        $http.post(groupURL, credentials).then(
          function(json){
            Recon.parseData(json.data);
            $scope.chartInfo = chartBuilder.buildTotalUsers(); 
            $scope.chartConfig = $scope.chartInfo.chartConfig;
            $scope.contentLoaded = true;

            $scope.chartInfo2 = chartBuilder.buildEngagementChart(); 
            $scope.chartConfig2 = $scope.chartInfo2.chartConfig;
            $scope.content2Loaded = true;

            var body = { sessionToken: ipCookie('sessionToken'), upto: Date.now() /1000 - 86400 };
            var metaURL = URLS.current + 'recon/meta/' + $scope.group_id + '/distinctmac';
            var chart = $http.post(metaURL, body).then(
              function(seenMacs){
                $scope.chartInfo3 = chartBuilder.buildRepeatVisitsChart(seenMacs.data); 
                $scope.chartConfig3 = $scope.chartInfo3.chartConfig;
                $scope.totalCusts = $scope.chartInfo3.totalCusts;
                $scope.content3Loaded = true;
              }
            );
          });
      }).then( function(){
    var mapURL = URLS.current + 'recon/meta/' + $scope.group_id+ '/maps';
    var postBody = { sessionToken: ipCookie('sessionToken') };
    $http.post(mapURL, postBody ).then(
        function(map){
          $scope.mapData = map.data;
          var gotMap = false;
          function getNormalizedCoord(coord, zoom) {
            var y = coord.y;
            var x = coord.x;
            //console.log('X: ' + x + ' Y: ' + y + ' ZOOM: ' + zoom);

            // tile range in one direction range is dependent on zoom level
            // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
            var tileRange = 1 << zoom;

            // don't repeat across y-axis (vertically)
            if (y < 0 || y >= tileRange) {
              return null;
            }

            // repeat across x-axis
            if (x < 0 || x >= tileRange) {
              x = (x % tileRange + tileRange) % tileRange;
            }

            return {
              x: x,
              y: y
            };
          }
          $scope.positions = [];
          $scope.onClick = function(event) {
              var ll = event.latLng;
              console.log('Lat: ' + ll.lat(), ' Lng: ' + ll.lng());
              $scope.positions.push({lat: ll.lat(), lng: ll.lng()});
              //$scope.map.markers[$scope.markers.length].setMap($scope.map);
          }
          //The PNG image itself is 2104 x 1641
          //center of bookstore: center="[43.074675, -89.397898]" 

          //Create the Options required to change the MapType
          var firstFloorTypeOptions = {
                getTileUrl: function(coord, zoom) {
                    var normalizedCoord = getNormalizedCoord(coord, zoom);
                    if (!normalizedCoord) {
                      return null;
                    }
                    if(gotMap === false) {
                      //console.log('Returning one map');
                      gotMap = true;
                      return $scope.mapData.url;
                    } else {
                      return null;
                    }
                },
                tileSize: new google.maps.Size($scope.mapData.tileSizeX, $scope.mapData.tileSizeY),
                maxZoom: $scope.mapData.maxZoom,
                minZoom: $scope.mapData.minZoom,
                radius: $scope.mapData.radius,
                name: $scope.mapData.name
          };

          $scope.firstFloorMapType = new google.maps.ImageMapType(firstFloorTypeOptions);
        }
    , function(error){$scope.mapError = true;}).then(function(){
        $scope.mapReady = true;});
;
      });
        
  }]);
