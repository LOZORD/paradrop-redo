'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:CalibrateCtrl
 * @description
 * # CalibrateCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('CalibrateCtrl',['$scope', 'URLS', '$http', 'gmapMaker',
    function ($scope, URLS, $http, gmapMaker) {
      $scope.authorizePage()
      .then(
        function(authorized){
          if(authorized){
            $scope.pollResult = null;
            var startURL = URLS.current + 'recon/maps/start';
            var finishURL = URLS.current + 'recon/maps/finish';
            var pollURL = URLS.current + 'recon/maps/poll';
            var coordsURL = URLS.current + 'recon/maps/coords';
            var mainBody = {};
            var coordsBody = {};
            var tsDeltas = {};

            $scope.start = function() {
              if(!$scope.mac){
                alert('Please enter a MAC.');
                return;
              }
              mainBody.sessionToken = $scope.sessionToken();
              mainBody.mac = $scope.mac;
              $http.post(startURL, mainBody ).then(
                function() {
                  //nothing to do
                },
                function(){
                  alert('There was an error you may already have started tracking.');
                }
              );
            };

            $scope.finish = function() {
              mainBody.sessionToken = $scope.sessionToken();
              mainBody.mac = $scope.mac;
              $http.post(finishURL, mainBody ).then(
                function() {
                  //nothing to do
                },
                function(){
                  alert('There was an error make sure you started tracking.');
                }
              );
            };

            $scope.poll = function() {
              if(!$scope.mac){
                alert('Please enter a MAC.');
                return;
              }
              mainBody.sessionToken = $scope.sessionToken();
              mainBody.mac = $scope.mac;
              $http.post(pollURL, mainBody ).then(
                function(result) {
                  var key;
                  var time = Math.floor(Date.now() / 1000);
                  tsDeltas = {};
                  if(!$scope.pollResult){
                    $scope.pollResult = {};
                    for(key in $scope.map.markers){
                      if(key !== 'currentLocation'){
                        $scope.map.markers[key].setIcon('images/green-wifi.png');
                      }
                    }
                  }
                  for(var rid in result.data){
                    if(result.data[rid]){
                      if($scope.pollResult[rid]){
                        if($scope.pollResult[rid].ts === result.data[rid].ts){
                          //signify already seen
                          if($scope.map.markers[$scope.apNameMap[rid].apid]){
                            $scope.map.markers[$scope.apNameMap[rid].apid]
                              .setIcon('images/red-wifi.png');
                          }
                        }else{
                          //signify new entry
                          if($scope.map.markers[$scope.apNameMap[rid].apid]){
                            $scope.map.markers[$scope.apNameMap[rid].apid]
                              .setIcon('images/green-wifi.png');
                          }
                        }
                      }
                      if($scope.map.markers[$scope.apNameMap[rid].apid]){
                        $scope.map.markers[$scope.apNameMap[rid].apid].setMap($scope.map);
                      }
                      tsDeltas[rid] = time - result.data[rid].ts;
                    }else{
                      if($scope.map.markers[$scope.apNameMap[rid].apid]){
                        $scope.map.markers[$scope.apNameMap[rid].apid].setMap(null);
                      }
                    }
                  }
                  $scope.pollResult = result.data;
                  var successString = 'Success<br>';
                  for(key in $scope.pollResult){
                    if($scope.pollResult[key]){
                      successString += key + ': {rssi: ' + $scope.pollResult[key].rssi;
                      successString += ', ts: ' + $scope.pollResult[key].ts + ' }<br>';
                    }
                  }
                  $scope.map.infoWindows.info.setContent(successString);
                  $scope.map.infoWindows.info.open($scope.map, $scope.map.markers.info);
                },
                function(){
                  alert('There was an error make sure you started tracking.');
                }
              );
            };

            $scope.sendCoord = function() {
              if(!$scope.mac){
                alert('Please enter a MAC.');
                return;
              }
              if(!$scope.coords){
                alert('Please select a location to send.');
                return;
              }
              coordsBody.sessionToken = $scope.sessionToken();
              coordsBody.lat = $scope.coords.lat;
              coordsBody.lng = $scope.coords.lng;
              coordsBody.mac = $scope.mac;
              coordsBody.time = Math.floor(Date.now() / 1000);
              coordsBody.extras = tsDeltas;
              tsDeltas = {};
              $http.post(coordsURL, coordsBody ).then(
                function() {
                  //nothing to do
                },
                function(){
                  alert('There was an error make sure you started tracking.');
                }
              );
            };

            $scope.clear = function() {
              for(var key in $scope.map.markers){
                $scope.map.markers[key].setMap(null);
              }
              $scope.showLocation = false;
              $scope.coords = {};
            };

            //grab and build map
            var mapInitURL = URLS.current + 'recon/maps/init';
            var postBody = { sessionToken: $scope.sessionToken() };
            $http.post(mapInitURL, postBody ).then(
              function(groupMaps){
                $scope.groupMaps = groupMaps.data[0];
                mainBody.reconid = $scope.groupMaps.reconid;
                mainBody.groupname = $scope.groupMaps.groupname;
                mainBody.typeid = $scope.groupMaps.data.typeid;
                $scope.apNameMap = $scope.groupMaps.map;
                $scope.revApNameMap = {};
                for(var key in $scope.apNameMap){
                  $scope.revApNameMap[$scope.apNameMap[key].apid] = $scope.apNameMap[key].name;
                }
                $scope.mapData = $scope.groupMaps.data;
                var builtMap = gmapMaker.buildMap($scope.mapData);
                $scope.firstFloorMapType = builtMap.mapType;
                $scope.onClick = function(event) {
                  var ll = event.latLng;
                  console.log('Lat: ' + ll.lat(), ' Lng: ' + ll.lng());
                  $scope.showLocation = true;
                  $scope.coords = { lat: ll.lat(), lng: ll.lng() };
                };
                $scope.$on('mapInitialized', function(event, map) {
                  $scope.map = map;
                });
                $scope.mapReady = true;
              },
              function(){$scope.mapError = true;
              });
          }
        }
      );
  }]);
