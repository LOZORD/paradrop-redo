'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:CalibrateCtrl
 * @description
 * # CalibrateCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
.controller('CalibrateCtrl',['$scope', 'URLS', '$http', 'gmapMaker', '$localStorage', '$window', '$routeParams', '$sce', '$interval',
        function ($scope, URLS, $http, gmapMaker, $localStorage, $window, $routeParams, $sce, $interval) {
            $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
            $scope.channels = [1, 6, 11, 36, 40, 44, 48, 52, 56, 60, 64, 149, 153, 157, 161, 165];
            $scope.pingRates = ['Disabled', 1, 5, 10];
            $scope.pingRate = $scope.pingRates[0];
            $scope.channel = $scope.channels[0];
            $scope.isTraining = true;
            if($scope.group_id){
                $scope.superAdmin = false;
            }else{
                $scope.superAdmin = true;
            }
            //enable bootstrap tooltips
            $(function () {
                $('[data-toggle="tooltip"]').tooltip();
            });
            $scope.authorizePage()
    .then(
        function(authorized){
            if(authorized){
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
                var startBody = {};
                var coordsBody = {};
                var lastSeenTS = null;

                $scope.startPing = function(){
                    if($scope.pingRate !== $scope.pingRates[0]){
                        $scope.pingPoll = $interval(ping, 1000/$scope.pingRate);
                        //make sure to cancel the interval when the controller is destroyed
                        $scope.$on('$destroy', function(){ $interval.cancel($scope.pingPoll);});
                        $scope.isPinging = true;
                    }
                };

                $scope.changePingRate = function(){
                    if($scope.isPinging){
                        $interval.cancel($scope.pingPoll);
                        $scope.isPinging = false;
                    }
                    //start with new rate unless disabled
                    $scope.startPing();
                    $scope.log('Ping Rate: ' + $scope.pingRate);
                };

                $scope.endPing = function(){
                    if($scope.isPinging){
                        $interval.cancel($scope.pingPoll);
                        $scope.isPinging = false;
                        $scope.pingRate = $scope.pingRates[0];
                    }
                };

                $scope.start = function() {
                    if(!$scope.mac){
                        $scope.closeAlerts();
                        $scope.dangerAlert('<strong>Error:</strong> Please enter a MAC.');
                        return;
                    }
                    startBody.sessionToken = $scope.sessionToken();
                    startBody.mac = $scope.mac;
                    startBody.reconid = $scope.groupMaps.reconid;
                    startBody.typeid = $scope.mapData.typeid;
                    startBody.channel = $scope.channel;
                    startBody.groupname = $scope.groupMaps.groupname;
                    $localStorage.mac = $scope.mac;
                    $scope.log('startBody for POST:');
                    $scope.log(startBody);
                    $http.post(startURL, startBody ).then(
                            function() {
                                //create wifi network
                                var wifiURL = URLS.current + 'recon/wifi/' + $scope.group_id +'/create';
                                var wifiBody = { sessionToken: $scope.sessionToken(), ssid: 'pdcalib', channel: $scope.channel };
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
                                $scope.endPing();
                                var wifiURL = URLS.current + 'recon/wifi/' + $scope.group_id + '/destroy';
                                var wifiBody = { sessionToken: $scope.sessionToken(), ssid: 'pdcalib'};
                                //destroy if create network box is checked
                                if($scope.createNetwork){
                                    $http.post(wifiURL, wifiBody).then(
                                        function(){
                                            //succesful destroy
                                            $scope.closeAlerts();
                                            $scope.successAlert('<strong>Success:</strong> You\'ve successfully exited calibration Mode. Network destroyed.');
                                        },
                                        function(){
                                            //failure to destroy
                                            $scope.closeAlerts();
                                            $scope.dangerAlert('<strong>Error:</strong> Successfully finished calibration. Failed to destroy Network');
                                        });
                                }else{
                                    $scope.closeAlerts();
                                    $scope.successAlert('<strong>Success:</strong> You\'ve successfully exited calibration Mode. Network not destroyed.');
                                }
                            },
                        function(){
                            $scope.closeAlerts();
                            $scope.dangerAlert('<strong>Error:</strong> Make sure you started tracking.');
                        }
                    );
                };

                $scope.poll = function() {
                    $scope.log('MAC: ' + $scope.mac);
                    if(!$scope.mac){
                        $scope.closeAlerts();
                        $scope.dangerAlert('<strong>Error:</strong> Please enter a MAC.');
                        return;
                    }
                    mainBody.sessionToken = $scope.sessionToken();
                    mainBody.mac = $scope.mac;
                    mainBody.reconid = $scope.groupMaps.reconid;
                    $scope.log('mainBody for POST:');
                    $scope.log(mainBody);
                    $http.post(pollURL, mainBody ).then(
                            function(result) {
                                $scope.log('Poll return:');
                                $scope.log(result.data);
                                $scope.isTraining = result.data.training;
                                if(!result.data.isValid){
                                    $scope.closeAlerts();
                                    $scope.warningAlert('We couldn\'t find any data for your device to make a prediction please try again in a few seconds.');
                                    return;
                                }
                                var coords = result.data.coords;
                                var time = new Date(result.data.ts * 1000);
                                $scope.successString = '<h3>Success</h3>';
                                $scope.successString += '<b>Time:</b> ' + time.toLocaleTimeString() + ' (' + result.data.ts + ')<br>';
                                $scope.successString += '<b>Map:</b> ' + coords.mapid + '<br><b>Zone Guess:</b> ' + 
                        coords.zone + '<br><b>Inside?:</b> ' + coords.isInside + '<br><b>Error:</b> ' + coords.err + '<br>';
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
                        $scope.heatmap = new google.maps.visualization.HeatmapLayer({data: heatMapData, radius: 35, opacity: 0.75});
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
                                icon: 'images/location.png'
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
                    var rate = $scope.pingRate;
                    if(rate === 'Disabled'){
                        rate = 0;
                    }
                    coordsBody.extras = {channel: $scope.channel, ping: rate};
                    $scope.log('coordsBody for POST:');
                    $scope.log(coordsBody);
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

                $scope.train = function() {
                    if($scope.isTraining){
                        return;
                    }
                    $scope.isTraining = true;
                    var trainBody = {};
                    trainBody.sessionToken = $scope.sessionToken();
                    trainBody.mac = $scope.mac;
                    trainBody.reconid = $scope.groupMaps.reconid;
                    var trainURL = URLS.current + 'recon/maps/train';
                    $http.post(trainURL, trainBody).then(
                            function(){
                                //success
                                $scope.closeAlerts();
                                $scope.successAlert('<strong>Success:</strong> Training begun!');
                            },
                            function(){
                                //failure
                                $scope.closeAlerts();
                                $scope.dangerAlert('<strong>Error:</strong> Could not start training.');
                                $scope.isTraining = false;
                            }
                            );
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
                                    $scope.log('Lat: ' + ll.lat(), ' Lng: ' + ll.lng());
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
                $scope.log('Current Map:');
                $scope.log(map);
                $scope.groupMaps = map;
                mainBody.reconid = $scope.groupMaps.reconid;
                mainBody.groupname = $scope.groupMaps.groupname;
                $scope.group_id = $scope.groupMaps.groupname;
                mainBody.typeid = $scope.groupMaps.data.typeid;
                $scope.apNameMap = $scope.groupMaps.map;
                //add to mappings
                for(var key in $scope.apNameMap){
                    $scope.apNameMap[$scope.apNameMap[key].apid] = {name: $scope.apNameMap[key].name, rid: key};
                    $scope.apNameMap[$scope.apNameMap[key].name] = {apid: $scope.apNameMap[key].apid, rid: key};
                }
                $scope.mapData = $scope.groupMaps.data;
                if(!$scope.mapData.invalid){
                    var builtMap = gmapMaker.buildMap($scope.mapData);
                    $scope.firstFloorMapType = builtMap.mapType;
                }
            };
        }
);

function ping(){
    var pingUrl = URLS.current + 'recon/maps/ping';
    $http.get(pingUrl).then(
            function(){
                //nothing for successful ping
            },
            function(err){
                $scope.log(err);
            }
            );
}
}]);
