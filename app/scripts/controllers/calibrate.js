'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:CalibrateCtrl
 * @description
 * # CalibrateCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('CalibrateCtrl',['$scope', 'ipCookie', 'URLS', '$http', 'gmapMaker',
    function ($scope, ipCookie, URLS, $http, gmapMaker) {
      $scope.initCurrentUser.promise
      .then(function(){ $scope.authorizePage(true);})
      .then(
        function(){
          $scope.showMarkers = {};
          var startURL = URLS.current + 'recon/maps/start';
          var finishURL = URLS.current + 'recon/maps/finish';
          var pollURL = URLS.current + 'recon/maps/poll';
          var coordsURL = URLS.current + 'recon/maps/coords';
          var mainBody = {};
          var coordsBody = {};
          var tsDeltas = {};
          $scope.start = function() {
            console.log('Starting...');
            if(!$scope.mac){
              alert("Please enter a MAC.");
              return;
            }
            mainBody.sessionToken = ipCookie('sessionToken');
            mainBody.mac = $scope.mac;
            $http.post(startURL, mainBody ).then(
              function(result) {
                //nothing to do
              },
              function(error){
                alert("There was an error you may already have started tracking.");
              }

            );
          }
          $scope.finish = function() {
            console.log('Finished.');
            mainBody.sessionToken = ipCookie('sessionToken');
            mainBody.mac = $scope.mac;
            $http.post(finishURL, mainBody ).then(
              function(result) {
                //nothing to do
              },
              function(error){
                alert("There was an error make sure you started tracking.");
              }

            );
          }
          $scope.poll = function() {
            console.log('polling...');
            if(!$scope.mac){
              alert("Please enter a MAC.");
              return;
            }
            mainBody.sessionToken = ipCookie('sessionToken');
            mainBody.mac = $scope.mac;
            $http.post(pollURL, mainBody ).then(
              function(result) {
                console.log(result.data);
                var time = Math.floor(Date.now() / 1000);
                tsDeltas = {};
                for(var rid in result.data){
                  if(result.data[rid]){
                    $scope.showMarkers[$scope.apNameMap[rid].apid] = true;
                    tsDeltas[rid] = time - result.data[rid].ts;
                  }else{
                    $scope.showMarkers[$scope.apNameMap[rid].apid] = false;
                  }
                }
                console.log(tsDeltas);
              },
              function(error){
                alert("There was an error make sure you started tracking.");
              }
            );
          }
          $scope.sendCoord = function() {
            console.log('sending coord...');
            if(!$scope.mac){
              alert("Please enter a MAC.");
              return;
            }
            if(!$scope.coords){
              alert("Please select a location to send.");
              return;
            }
            coordsBody.sessionToken = ipCookie('sessionToken');
            coordsBody.lat = $scope.coords.lat;
            coordsBody.lng = $scope.coords.lng;
            coordsBody.mac = $scope.mac;
            coordsBody.time = Math.floor(Date.now() / 1000);
            coordsBody.extras = tsDeltas;
            tsDeltas = {};
            $http.post(coordsURL, coordsBody ).then(
              function(result) {
                //nothing to do
              },
              function(error){
                alert("There was an error make sure you started tracking.");
              }

            );
          }
          $scope.clear = function() {
            $scope.showLocation = false;
            $scope.coords = {};
          }
          //grab and build map
          var mapInitURL = URLS.current + 'recon/maps/init';
          var postBody = { sessionToken: ipCookie('sessionToken') };
          $http.post(mapInitURL, postBody ).then(
              function(groupMaps){
                $scope.groupMaps = groupMaps.data[0];
                mainBody.reconid = $scope.groupMaps.reconid;
                mainBody.groupname = $scope.groupMaps.groupname;
                mainBody.typeid = $scope.groupMaps.data.typeid;
                $scope.apNameMap = $scope.groupMaps.map;
                $scope.revApNameMap = {};
                for(var key in $scope.apNameMap){
                  $scope.showMarkers[$scope.apNameMap[key].apid] = true;
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
                }
                $scope.heatMapData = gmapMaker.buildHeatmap();
                $scope.mapReady = true;
              }
          , function(error){$scope.mapError = true;});
        }
      );
  }]);
