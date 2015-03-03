'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MapSettingsCtrl
 * @description
 * # MapSettingsCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MapSettingsCtrl',['$scope', 'URLS', '$http', '$sce', '$routeParams', 'gmapMaker', '$localStorage', '$route',
    function ($scope, URLS, $http, $sce, $routeParams, gmapMaker, $localStorage, $route) {
      $scope.colors = [
          {name:'BLUE', code:'#0000FF'},
          {name:'YELLOW', code:'#FFFF00'},
          {name:'RED', code:'FF0000'},
          {name:'GREEN', code:'#008000'},
          {name:'PURPLE', code:'#800080'},
          {name:'ORANGE', code:'#FFA500'},
          {name:'LIME', code:'#00FF00'},
          {name:'TEAL', code:'#008080'},
      ];
      var boundID = 0;
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      var group = $scope.group_id.toString();
      var isDeleteMode = false;
      $scope.settingsJSON = {};
      $scope.zone = {};
      $scope.authorizePage()
      .then(function(authorized){
        if(authorized){
          var mapInitURL = URLS.current + 'recon/maps/init';
          var postBody = { sessionToken: $scope.sessionToken() };
          $http.post(mapInitURL, postBody ).then(
              function(groupMaps){
                $scope.mapsArray = groupMaps.data;
                for(var i in $scope.mapsArray){
                  if($scope.mapsArray[i].groupname == $scope.group_id){
                    $scope.groupMaps = $scope.mapsArray[i];
                    break;
                  }
                }
                if($localStorage.mapSettings && $localStorage.mapSettings[group]){
                  $scope.mapData = $localStorage.mapSettings[group];
                }else{
                  $scope.mapData = $scope.groupMaps.data;
                }
                $scope.settingsJSON = angular.copy($scope.mapData);
                var builtMap = gmapMaker.buildMap($scope.mapData);
                $scope.apNameMap = $scope.groupMaps.map;
                $scope.revApNameMap = {};

                for(var key in $scope.apNameMap){
                  $scope.revApNameMap[$scope.apNameMap[key].apid] = $scope.apNameMap[key].name;
                }

                $scope.firstFloorMapType = builtMap.mapType;

                $scope.$on('mapInitialized', function(event, map) {
                  $scope.map = map;
                  $scope.infobox = map.infoWindows.info;
                  $scope.map.markers.infoMarker.setVisible(false);
                  $scope.map.setCenter(new google.maps.LatLng($scope.mapData.centerX, $scope.mapData.centerY));
                  for(var boundary in $scope.mapData.boundary){
                    $scope.addBoundary($scope.mapData.boundary[boundary]);
                  }
                  for(var ap in $scope.mapData.aps){
                    $scope.addAP($scope.mapData.aps[ap]);
                  }
                });
              }
          , function(error){$scope.mapError = true;});
        };
      });

      $scope.onClick = function(event) {
        if(!$scope.isDeleteMode && !$scope.isZoneMode){
          var ll = event.latLng;
          console.log('Lat: ' + ll.lat(), ' Lng: ' + ll.lng());
          $scope.showLocation = true;
          $scope.coords = { lat: ll.lat(), lng: ll.lng() };
          $scope.infobox.open($scope.map, $scope.map.markers.info);
          $scope.infobox.setPosition($scope.coords);
          $scope.infobox
            .setContent('<div>Lat: '+$scope.coords.lat+'</div>'
                + '<div>Lng: '+$scope.coords.lng+'</div>');
        }
      };
      var isVisible = true;
      $scope.toggleMarkers = function(){
        isVisible = !isVisible;
        for(var marker in $scope.map.markers){
          if(marker === 'infoMarker'){
            continue;
          }
          $scope.map.markers[marker].setVisible(isVisible);
        }
      };

      $scope.addZone = function(){
        $scope.isZoneMode = true;
        $scope.toggleMarkers();
      };

      $scope.confirmZone = function(){
        var polyCoords = [];
        var lastMark = {};
        for(var marker in $scope.map.markers){
          if(marker.indexOf('zone') > -1){
            lastMark = $scope.map.markers[marker];
            polyCoords.push(lastMark.position);
          }
        }
        polyCoords.unshift(lastMark.position);

        // Construct the polygon.
        var polygon = new google.maps.Polygon({
          paths: polyCoords,
          strokeColor: $scope.zone.color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: $scope.zone.color,
          fillOpacity: 0.35,
          clickable: false
        });

        polygon.setMap($scope.map);
        $scope.abortZone();
        $scope.zone.name = '';
        $scope.zone.color = '';
      };

      $scope.abortZone = function(){
        //clean up markers
        for(var marker in $scope.map.markers){
          if(marker.indexOf('zone') > -1){
           $scope.map.markers[marker].setMap(null); 
           delete $scope.map.markers[marker];
          }
        }
        $scope.toggleMarkers();
        $scope.isZoneMode = false;
      };

      $scope.numZoneMarkers = function(){
        var z = 0;
        if($scope.map){
          for(var i in $scope.map.markers){
            if(i.indexOf('zone') > -1){
              z++;
            }
          }
        }
        return z;
      };

      var zoneID = 0;
      $scope.addZoneBoundary = function(){
        var lat = -19;
        var lng = -40;
        var myLatlng = new google.maps.LatLng(lat,lng);
        var marker = new google.maps.Marker({
          position: myLatlng,
          map: $scope.map,
          title: 'Zone Boundary',
          draggable: true,
          icon: 'images/here.png',
          id: 'zone' + zoneID
        });
        $scope.map.markers['zone'+ zoneID] = marker;
        zoneID++;
      };

      $scope.addAP = function(ap){
        var lat = ap.lat;
        var lng = ap.lng;
        var myLatlng = new google.maps.LatLng(lat,lng);
        var marker = new google.maps.Marker({
          position: myLatlng,
          map: $scope.map,
          title: $scope.revApNameMap[ap.apid],
          draggable: true,
          icon: 'images/wifi.png',
          id: 'apid' + ap.apid
        });
        $scope.map.markers['apid' + ap.apid] = marker;
        $scope.updateMarkers();
        boundID++;
      };

      $scope.addBoundary = function(coords){
        var lat = -19;
        var lng = -40;
        if(coords){
          lat = coords[0];
          lng = coords[1];
        }
        var myLatlng = new google.maps.LatLng(lat,lng);
        var marker = new google.maps.Marker({
          position: myLatlng,
          map: $scope.map,
          title: 'Boundary Marker',
          draggable: true,
          icon: 'images/boundary.png',
          id: 'boundary' + boundID
        });
        $scope.map.markers['boundary'+ boundID] = marker;
        $scope.updateMarkers();
        boundID++;
      };

      $scope.toggleDeleteMode = function(){
        $scope.isDeleteMode = !$scope.isDeleteMode;
        if($scope.isDeleteMode){
          for(var marker in $scope.map.markers){
            google.maps.event.addListener($scope.map.markers[marker], 'click', removeMarkerFnc($scope.map.markers[marker]));
          }
        }
      };

      function removeMarkerFnc(marker){

       return function(event){
                if($scope.isDeleteMode){
                  $scope.updateMarkers();
                  marker.setMap(null);
                  delete $scope.map.markers[marker.id];
                  $scope.updateMarkers();
                  console.log($scope.settingsJSON);
                }
              };
      };

      $scope.updateMarkers = function() {
        $scope.settingsJSON.aps = [];
        $scope.settingsJSON.boundary = [];
        for(var marker in $scope.map.markers){
          if(marker === 'infoMarker'){
            continue;
          }else if(marker.indexOf('boundary') > -1 ){
            //boundary marker
            var boundary = [$scope.map.markers[marker].position.k, $scope.map.markers[marker].position.D ];
            $scope.settingsJSON.boundary.push(boundary);
          }else if(marker.indexOf('apid') > -1){
            //ap marker
            var marker = {apid: marker, lat: $scope.map.markers[marker].position.k, lng: $scope.map.markers[marker].position.D };
            $scope.settingsJSON.aps.push(marker);
          }
        }
       //console.log($scope.settingsJSON);
       // console.log('******************');
      };

      $scope.submitChanges = function(){
        $scope.updateMarkers();
        for(var key in $scope.settingsJSON){
          if($scope.settingsJSON[key] === undefined 
              || $scope.settingsJSON[key] === "" 
              || $scope.settingsJSON[key] === null)
          {
            alert('Reverting settings due to invalid value for: ' + key);
            $scope.revert();
            return;
          }
        }
        //console.log("Validation successful ready to send JSON");
        //console.log($scope.settingsJSON);
        if(!$localStorage.mapSettings){
          $localStorage.mapSettings = {};
        }
        $localStorage.mapSettings[group] = $scope.settingsJSON
        //console.log($localStorage.mapSettings);
        $route.reload();
      };

      $scope.destroyCookie = function(){
        if($localStorage.mapSettings){
          delete $localStorage.mapSettings[group];
          var i = 0;
          for(var key in $localStorage.mapSettings){
            i++;
          }
          if(i === 0){
            delete $localStorage.mapSettings;
          }
          //console.log($localStorage.mapSettings);
          $route.reload();
        }
        //console.log($localStorage.mapSettings);
      };
  }]);
