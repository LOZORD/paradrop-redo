'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconMapCtrl
 * @description
 * # ReconMapCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconMapCtrl',['$scope', 'ipCookie', 'URLS', '$http', '$sce', '$routeParams', function ($scope, ipCookie, URLS, $http, $sce, $routeParams) {
    $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
    $scope.initCurrentUser.promise
    .then(function(){ $scope.authorizePage();})
    .then(
      function(){
        $scope.showMarkers = true;
        $scope.markerBtnText = 'Hide';
        $scope.heatBtnText = 'Hide';
        $scope.showInfoBox = {};
        $scope.showInfoWindow = function(apid){
                $scope.showInfoBox[apid] = !$scope.showInfoBox[apid];
        };
        $scope.changeHeatText = function(){
          $scope.hideHeatMap = !$scope.hideHeatMap;
          if(!$scope.hideHeatMap){
            $scope.heatBtnText = 'Hide';
          }else{
            $scope.heatBtnText = 'Show';
          }
        };
        $scope.changeMarkerText = function(){
          if($scope.showMarkers){
            $scope.markerBtnText = 'Hide';
          }else{
            $scope.markerBtnText = 'Show';
          }
        };
        $scope.apNameMap = {};
        for(var ap in $scope.currentUser.aps){
          $scope.apNameMap[$scope.currentUser.aps[ap].guid] = $scope.currentUser.aps[ap].name;
        }
        var mapURL = URLS.current + 'recon/meta/' + $scope.group_id+ '/maps';
        var postBody = { sessionToken: ipCookie('sessionToken') };
        $http.post(mapURL, postBody ).then(
            function(map){
              var genFakeMarkers = function(cnt, noise) {
                var markers = [];
                var hotspots = [
                  [-20, -40],
                  [-20, -53],
                  [-10, -33],
                  [-10, -45],
                  [-25, -45],
                  [-28.5, -36],
                  [-26, -49],
                  [-20, -33]
                ];
                for(var i = 0; i < cnt ; i++) {
                  // First randomly choose a hotspot
                  var h = Math.floor(Math.random() * hotspots.length);
                  // Now use random to add some noise to the marker coords
                  var lat = Math.random() * noise + hotspots[h][0];
                  var lng = Math.random() * noise + hotspots[h][1];
                  markers.push([lat, lng]);
                }
                return markers;
              }
              $scope.taxiData = [ ];
              var fakes = genFakeMarkers(100, 5);
              for(var i in fakes){
                $scope.taxiData.push(new google.maps.LatLng(fakes[i][0],fakes[i][1]));
              }
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
                  //$scope.positions.push({lat: ll.lat(), lng: ll.lng()});
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
              $scope.$on('mapInitialized', function(event, map) {
                      $scope.heatmap = map.heatmapLayers.foo;
                      $scope.map = map;
                      $scope.heatmap.set('radius', 30);
                          });
              $scope.toggleHeatmap= function(event) {
                $scope.heatmap.setMap($scope.heatmap.getMap() ? null : $scope.map);
              };
            }
        , function(error){$scope.mapError = true;}).then(function(){
            $scope.mapReady = true;});
    
      });
  }]);
