'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:CalibrateCtrl
 * @description
 * # CalibrateCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('CalibrateCtrl',['$scope', 'URLS', '$http', 'gmapMaker', '$localStorage', '$window', '$routeParams', '$sce',
    function ($scope, URLS, $http, gmapMaker, $localStorage, $window, $routeParams, $sce) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      if($scope.group_id){
        $scope.superAdmin = false;
      }else{
        $scope.superAdmin = true;
      }
      //enable bootstrap tooltips
      $(function () {
          $('[data-toggle="tooltip"]').tooltip()
      })
      $scope.authorizePage()
      .then(
        function(authorized){
          if(authorized){
            console.log($localStorage.calibrateIndex);
            if(!$localStorage.calibrateIndex){
              $localStorage.calibrateIndex = 0;
            }
            if(!$localStorage.adminCalibrateIndex){
              $localStorage.adminCalibrateIndex = 0;
            }
            $scope.mac = $localStorage.mac;
            var startURL = URLS.current + 'recon/maps/start';
            var finishURL = URLS.current + 'recon/maps/finish';
            var pollURL = URLS.current + 'recon/maps/poll';
            var coordsURL = URLS.current + 'recon/maps/coords';
            var mainBody = {};
            var coordsBody = {};
            var lastSeenTS = null;

            $scope.start = function() {
              if(!$scope.mac){
                $scope.closeAlerts();
                $scope.dangerAlert('<strong>Error:</strong> Please enter a MAC.');
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
                  if($scope.createNetwork){
                    $http.post(wifiURL, wifiBody).then(
                      function() {
                        //success
                        $scope.closeAlerts();
                        $scope.successAlert('Wifi Network created!');
                      },
                      function(){
                        //failure
                        $scope.closeAlerts();
                        $scope.dangerAlert('<strong>Error:</strong> Calibration started. Failed to create Network.');

                      });
                  }else{
                    $scope.closeAlerts();
                    $scope.successAlert('Calibration successfully started. No network created.');
                  }
                },
                function(){
                  $scope.closeAlerts();
                  $scope.dangerAlert('There was an error you may already have started tracking.');
                }
              );
            };

            $scope.finish = function() {
              mainBody.sessionToken = $scope.sessionToken();
              mainBody.mac = $scope.mac;
              mainBody.reconid = $scope.groupMaps.reconid;
              $http.post(finishURL, mainBody ).then(
                function() {
                  var wifiURL = URLS.current + 'recon/wifi/' + $scope.group_id + '/destroy';
                  var wifiBody = { sessionToken: $scope.sessionToken(), ssid: 'pdcalib'};
                  $http.post(wifiURL, wifiBody).then(
                    function(){
                      //succesful destroy
                      $scope.closeAlerts();
                      $scope.successAlert('<strong>Success:</strong> You\'ve successfully exited calibration Mode');
                    },
                    function(){
                      //failure to destroy
                      $scope.closeAlerts();
                      $scope.dangerAlert('<strong>Error:</strong> Successfully finished calibration. Failed to destroy Network');
                    });
                },
                function(){
                  $scope.closeAlerts();
                  $scope.dangerAlert('<strong>Error:</strong> Make sure you started tracking.');
                }
              );
            };

            $scope.poll = function() {
              console.log($scope.mac);
              if(!$scope.mac){
                $scope.closeAlerts();
                $scope.dangerAlert('<strong>Error:</strong> Please enter a MAC.');
                return;
              }
              mainBody.sessionToken = $scope.sessionToken();
              mainBody.mac = $scope.mac;
              mainBody.reconid = $scope.groupMaps.reconid;
              console.log(mainBody);
              $http.post(pollURL, mainBody ).then(
                function(result) {
                  console.log(result.data);
                  var coords = result.data.coords;
                  $scope.isTraining = result.data.training;
                  var time = new Date(result.data.ts * 1000);
                  $scope.successString = '<h3>Success</h3>';
                  $scope.successString += '<b>Time:</b> ' + time.toLocaleTimeString() + ' (' + result.data.ts + ')<br>';
                  $scope.successString += '<b>Map:</b> ' + coords.mapid + '<br><b>Zone Guess:</b> ' + 
                    coords.zone + '<br><b>Inside?:</b> ' + coords.isinside + '<br><b>Error:</b> ' + coords.err + '<br>';
                  for(var key in result.data.signals){
                    if(result.data.signals[key]){
                      $scope.successString += '<b>' + $scope.apNameMap[key].name + '(rssi):</b> ' + result.data.signals[key] + '<br>';
                    }
                  }
                  lastSeenTS = result.data.ts;
                  if($scope.mapData.invalid){
                    //skip other stuff
                  }else{
                    for(var ap in $scope.map.markers){
                      if(ap === 'currentLocation' || ap === 'guessMarker'){
                        continue;
                      }else if(result.data.signals[$scope.apNameMap[ap].rid]){
                        //ap saw you
                        var strength = result.data.signals[$scope.apNameMap[ap].rid];
                        if(strength > -65){
                          $scope.map.markers[ap].setIcon('images/green-signal.png');
                        }else if(strength > -85){
                          $scope.map.markers[ap].setIcon('images/yellow-signal.png');
                        }else{
                          $scope.map.markers[ap].setIcon('images/red-signal.png');
                        }
                        $scope.map.markers[ap].setMap($scope.map);
                      }else{
                        //ap didn't see you
                        $scope.map.markers[ap].setMap(null);
                      }
                    }
                    var heatMapData = [];
                    for(var point in coords.heatmap){
                      heatMapData.push({ location: new google.maps.LatLng(coords.heatmap[point][0], coords.heatmap[point][1]), weight: coords.heatmap[point][2]});
                    }
                    if($scope.heatmap){
                      $scope.heatmap.setMap(null);
                      delete $scope.heatmap;
                    }
                    $scope.heatmap = new google.maps.visualization.HeatmapLayer({data: heatMapData, radius: 35, opacity: .75});
                    if(!$scope.hideHeatmap){
                      $scope.heatmap.setMap($scope.map);
                    }
                    var myLatlng = new google.maps.LatLng(coords.lat, coords.lng);
                    if($scope.map.markers.guessMarker){
                      $scope.map.markers.guessMarker.setPosition(myLatlng);
                      $scope.map.markers.guessMarker.setMap($scope.map);
                      $scope.guessInfowindow.setContent($scope.successString);
                      $scope.guessInfowindow.open($scope.map,$scope.map.markers.guessMarker);
                    }else{
                      $scope.map.markers.guessMarker = new google.maps.Marker({
                        position: myLatlng,
                        map: $scope.map,
                        title: 'We think you\'re here.',
                        icon: 'images/down.png'
                      });
                      $scope.guessInfowindow = new google.maps.InfoWindow({
                        content: $scope.successString
                      });
                      google.maps.event.addListener($scope.map.markers.guessMarker, 'click', function() {
                        $scope.guessInfowindow.open($scope.map,$scope.map.markers.guessMarker);
                      });
                      $scope.guessInfowindow.open($scope.map,$scope.map.markers.guessMarker);
                    }
                  }
                  $scope.closeAlerts();
                  $scope.successAlert('<strong>Success:</strong> Poll response recieved.');
                },
                function(){
                  $scope.closeAlerts();
                  $scope.dangerAlert('<strong>Error:</strong> Make sure you started tracking.');
                }
              );
            };

            $scope.$watch(
                  function() { return $scope.hideHeatmap; },
                  function(hideHeatMap) {
                    if($scope.map && $scope.heatmap){
                      if (hideHeatMap) {
                        $scope.heatmap.setMap(null);
                      }else{
                        $scope.heatmap.setMap($scope.map);
                      }
                    }
                  }
            );

            $scope.sendCoord = function() {
              if(!$scope.mac){
                $scope.closeAlerts();
                $scope.dangerAlert('<strong>Error:</strong> Please enter a MAC.');
                return;
              }
              if(!$scope.coords && !$scope.mapData.invalid){
                $scope.closeAlerts();
                $scope.dangerAlert('<strong>Error:</strong> Please select a location to send.');
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
              coordsBody.time = lastSeenTS;
              coordsBody.typeid = $scope.mapData.typeid;
              coordsBody.reconid = $scope.groupMaps.reconid;
              $http.post(coordsURL, coordsBody ).then(
                function() {
                  $scope.closeAlerts();
                  $scope.successAlert('<strong>Success:</strong> Coordinates successfully sent.');
                },
                function(){
                  $scope.closeAlerts();
                  $scope.dangerAlert('<strong>Error:</strong> Make sure you started tracking.');
                }
              );
            };

            $scope.clear = function() {
              for(var key in $scope.map.markers){
                $scope.map.markers[key].setMap(null);
              }
              if($scope.heatmap){
                $scope.heatmap.setMap(null);
              }
              $scope.showLocation = false;
              $scope.coords = {};
            };

            //grab and build map
            var mapInitURL = URLS.current + 'recon/meta/' + $scope.group_id+ '/maps';
            if($scope.superAdmin){
              mapInitURL = URLS.current + 'recon/maps/init';
            }
            var postBody = { sessionToken: $scope.sessionToken() };
            $http.post(mapInitURL, postBody ).then(
              function(groupMaps){
                $scope.mapsArray = groupMaps.data;
                if($scope.superAdmin){
                  $scope.setMap($scope.mapsArray[$localStorage.adminCalibrateIndex]);
                }else{
                  if($scope.mapsArray.length < $localStorage.calibrateIndex){
                    $localStorage.calibrateIndex = 0;
                  }
                  $scope.setMap($scope.mapsArray[$localStorage.calibrateIndex]);
                }

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
              function(){
                $scope.mapError = true;
                $scope.closeAlerts();
                $scope.dangerAlert('<strong>Error:</strong> There was an error retrieving the map information. Please refresh the page to try again.');
              });
          }

          $scope.switchMap = function(index){
            if($scope.superAdmin){
              $localStorage.adminCalibrateIndex = index;
            }else{
              $localStorage.calibrateIndex = index;
            }
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
            console.log($scope.apNameMap);
            //add to mappings
            for(var key in $scope.apNameMap){
              $scope.apNameMap[$scope.apNameMap[key].apid] = {name: $scope.apNameMap[key].name, rid: key};
              $scope.apNameMap[$scope.apNameMap[key].name] = {apid: $scope.apNameMap[key].apid, rid: key};
            }
            console.log($scope.apNameMap);
            $scope.mapData = $scope.groupMaps.data;
            if(!$scope.mapData.invalid){
              var builtMap = gmapMaker.buildMap($scope.mapData);
              $scope.firstFloorMapType = builtMap.mapType;
            }
          };
        }
      );
  }]);
