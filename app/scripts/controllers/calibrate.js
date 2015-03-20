'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:CalibrateCtrl
 * @description
 * # CalibrateCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('CalibrateCtrl',['$scope', 'URLS', '$http', 'gmapMaker', '$localStorage', '$window',
    function ($scope, URLS, $http, gmapMaker, $localStorage, $window) {
      $scope.authorizePage()
      .then(
        function(authorized){
          if(authorized){
            console.log($localStorage.calibrateIndex);
            if(!$localStorage.calibrateIndex){
              $localStorage.calibrateIndex = 0;
            }
            $scope.mac = $localStorage.mac;
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
              mainBody.reconid = $scope.groupMaps.reconid;
              $localStorage.mac = $scope.mac;
              $http.post(startURL, mainBody ).then(
                function() {
                  //create wifi network
                  var wifiURL = URLS.current + 'recon/wifi/' + $scope.group_id +'/create';
                  var wifiBody = { sessionToken: $scope.sessionToken(), ssid: 'pdcalib' };
                  $http.post(wifiURL, wifiBody).then(
                    function(success) {
                      //success
                      alert('Wifi network created.');
                    },
                    function(error){
                      //failure
                      alert('Error failed to create network.');
                    });
                },
                function(){
                  alert('There was an error you may already have started tracking.');
                }
              );
            };

            $scope.finish = function() {
              mainBody.sessionToken = $scope.sessionToken();
              mainBody.mac = $scope.mac;
              mainBody.reconid = $scope.groupMaps.reconid;
              $http.post(finishURL, mainBody ).then(
                function() {
                  //nothing to do
                  var wifiURL = URLS.current + 'recon/wifi/' + $scope.group_id + '/destroy';
                  var wifiBody = { sessionToken: $scope.sessionToken(), ssid: 'pdcalib'};
                  $http.post(wifiURL, wifiBody).then(
                    function(success){
                      //succesful destroy
                      alert('Wifi network destroyed.');
                    },
                    function(error){
                      //failure to destroy
                      alert('Error failed to destroy Network');
                    });
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
              mainBody.reconid = $scope.groupMaps.reconid;
              $http.post(pollURL, mainBody ).then(
                function(result) {
                  var time = Math.floor(Date.now() / 1000);
                  if($scope.mapData.invalid){
                    for(var rid in result.data){
                      if(result.data[rid]){
                        tsDeltas[rid] = time - result.data[rid].ts;
                      }
                    }
                  }else{
                    var key;
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
                  }
                  $scope.pollResult = result.data;
                  $scope.successString = 'Success<br>';
                  for(key in $scope.pollResult){
                    if($scope.pollResult[key]){
                      $scope.successString += key + ': {rssi: ' + $scope.pollResult[key].rssi;
                      $scope.successString += ', ts: ' + $scope.pollResult[key].ts + ' }<br>';
                    }
                  }
                  if(!$scope.mapData.invalid){
                    if(!$scope.infobox){
                      $scope.infobox = new google.maps.InfoWindow();
                    }
                    var ll = new google.maps.LatLng($scope.mapData.centerX, $scope.mapData.centerY);
                    $scope.infobox.open($scope.map);
                    $scope.infobox.setPosition(ll);
                    $scope.infobox.setContent($scope.successString);
                  }
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
              if(!$scope.coords && !$scope.mapData.invalid){
                alert('Please select a location to send.');
                return;
              }
              coordsBody.sessionToken = $scope.sessionToken();
              if($scope.mapData.invalid){
                coordsBody.lat = null;
                coordsBody.lng = null;
                coordsBody.invalid = 1;
              }else{
                coordsBody.lat = $scope.coords.lat;
                coordsBody.lng = $scope.coords.lng;
              }
              coordsBody.mac = $scope.mac;
              coordsBody.time = Math.floor(Date.now() / 1000);
              coordsBody.extras = tsDeltas;
              coordsBody.typeid = $scope.mapData.typeid;
              coordsBody.reconid = $scope.groupMaps.reconid;
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
                $scope.mapsArray = groupMaps.data;
                $scope.setMap($scope.mapsArray[$localStorage.calibrateIndex]);

                if(!$scope.mapData.invalid){
                  $scope.onClick = function(event) {
                    var ll = event.latLng;
                    console.log('Lat: ' + ll.lat(), ' Lng: ' + ll.lng());
                    $scope.showLocation = true;
                    $scope.coords = { lat: ll.lat(), lng: ll.lng() };
                  };
                  $scope.$on('mapInitialized', function(event, map) {
                    $scope.map = map;
                  });
                }
              },
              function(){$scope.mapError = true;});
          }

          $scope.switchMap = function(index){
            $localStorage.calibrateIndex = index;
            setTimeout(function(){$window.location.reload();}, 1000);
          };

          $scope.setMap = function(map){
            console.log(map);
            $scope.groupMaps = map;
            mainBody.reconid = $scope.groupMaps.reconid;
            mainBody.groupname = $scope.groupMaps.groupname;
            $scope.group_id = $scope.groupMaps.groupname;
            mainBody.typeid = $scope.groupMaps.data.typeid;
            $scope.apNameMap = $scope.groupMaps.map;
            $scope.revApNameMap = {};
            for(var key in $scope.apNameMap){
              $scope.revApNameMap[$scope.apNameMap[key].apid] = $scope.apNameMap[key].name;
            }
            $scope.mapData = $scope.groupMaps.data;
            if(!$scope.mapData.invalid){
              var builtMap = gmapMaker.buildMap($scope.mapData);
              $scope.firstFloorMapType = builtMap.mapType;
            }
          };
        }
      );
  }]);
