'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MapSettingsCtrl
 * @description
 * # MapSettingsCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MapSettingsCtrl',['$scope', 'URLS', '$http', '$sce', 'gmapMaker', '$route','$routeParams', '$interval',
    function ($scope, URLS, $http, $sce, gmapMaker, $route, $routeParams, $interval) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      if($scope.group_id){
        $scope.superAdmin = false;
      }else{
        $scope.superAdmin = true;
      }
      $scope.channels = [1, 6, 11, 36, 40, 44, 48, 52, 56, 60, 64, 149, 153, 157, 161, 165];
      $scope.markersVisible = true;
      $scope.colors = [
          {name:'BLUE', code:'#0000FF'},
          {name:'YELLOW', code:'#FFFF00'},
          {name:'RED', code:'#FF0000'},
          {name:'GREEN', code:'#008000'},
          {name:'PURPLE', code:'#800080'},
          {name:'ORANGE', code:'#FFA500'},
          {name:'LIME', code:'#00FF00'},
          {name:'BLACK', code:'#000000'},
      ];
      $scope.types = [
          {name:'Customer'},
          {name:'Employee'},
          {name:'Outside'},
          {name:'Impossible'}
      ];
      $scope.mapSettingsFields = {
        name: null,
        centerX: null,
        centerY: null,
        maxZoom: null,
        minZoom: null,
        radius: null,
        tileSizeX: null,
        tileSizeY: null,
        minCoords: null,
        maxCoords: null,
        imageTile: null,
      };

      $scope.settingsJSON = {};
      $scope.zone = {};
      $scope.authorizePage()
      .then(function(authorized){
        if(authorized){
          var mapInitURL = URLS.current + 'recon/meta/' + $scope.group_id+ '/maps';
          if($scope.superAdmin){
            mapInitURL = URLS.current + 'recon/maps/init';
          }
          var postBody = { sessionToken: $scope.sessionToken() };
          $http.post(mapInitURL, postBody ).then(
              function(groupMaps){
                $scope.mapsArray = groupMaps.data;
                if($scope.superAdmin){
                  $scope.setMap($scope.mapsArray[gmapMaker.getIndex('adminSettings')]);
                }else{
                  $scope.setMap($scope.mapsArray[gmapMaker.getIndex('settings')]);
                }

                $scope.$on('mapInitialized', function(event, map) {
                  $scope.map = map;
                  $scope.infobox = new google.maps.InfoWindow();
                  $scope.map.setCenter(new google.maps.LatLng($scope.mapData.centerX, $scope.mapData.centerY));
                  $scope.boundPoly = gmapMaker.newPoly('#FF0000');
                  for(var boundary in $scope.mapData.boundary){
                    $scope.addBoundary($scope.mapData.boundary[boundary]);
                  }
                  for(var ap in $scope.mapData.aps){
                    $scope.addAP($scope.mapData.aps[ap]);
                  }
                  $scope.updatePoly();
                  for(var zone in $scope.mapData.zones){
                    $scope.createZones($scope.mapData.zones[zone]);
                  }
                  for(var mac in $scope.mapData.fixedMacs){
                    $scope.addMacMarker($scope.mapData.fixedMacs[mac], mac);
                  }
                  if($scope.mapData.walls){
                    $scope.walls = gmapMaker.buildWalls($scope.mapData.walls);
                    for(var wall in $scope.walls){
                      $scope.walls[wall].setMap($scope.map);
                    }
                  }
                  if($scope.mapData.syncCoords){
                    var lat = $scope.mapData.syncCoords[0];
                    var lng = $scope.mapData.syncCoords[1];
                    var myLatlng = new google.maps.LatLng(lat,lng);
                    var marker = new google.maps.Marker({
                      position: myLatlng,
                      map: $scope.map,
                      title: 'Sync Marker',
                      draggable: true,
                      icon: 'images/double-arrow.png',
                      id: 'syncMarker'
                    });
                    $scope.map.markers.syncMarker = marker;
                    $scope.updateMarkers();
                  }
                  if($scope.mapData.minCoords && $scope.mapData.maxCoords){
                    $scope.drawMinMaxBounds();
                  }
                });
              }, 
              function(){$scope.mapError = true;});
        }
      });

      $scope.drawMinMaxBounds = function(){
        if($scope.minMaxPoly){
          $scope.minMaxPoly.setMap(null);
          $scope.minMaxPoly = null;
        }
        $scope.minMaxPoly = gmapMaker.newPoly('#191970');
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.minCoords[0],$scope.mapData.minCoords[1]));
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.maxCoords[0],$scope.mapData.minCoords[1]));
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.maxCoords[0],$scope.mapData.maxCoords[1]));
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.minCoords[0],$scope.mapData.maxCoords[1]));
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.minCoords[0],$scope.mapData.minCoords[1]));
        $scope.minMaxPoly.setMap($scope.map);
      };

      $scope.switchMap = function(index){
        if($scope.superAdmin){
          gmapMaker.setIndex(index, 'adminSettings');
        }else{
          gmapMaker.setIndex(index, 'settings');
        }
        $route.reload();
      };

      $scope.setMap = function(map){
        console.log(map);
        if(map.data.invalid){
          for(var i in $scope.mapsArray){
            if($scope.mapsArray[i].data.invalid){
              continue;
            }else{
              map = $scope.mapsArray[i];
              if($scope.superAdmin){
                gmapMaker.setIndex(i, 'adminSettings');
              }else{
                gmapMaker.setIndex(i, 'settings');
              }
              break;
            }
          }
        }
        $scope.groupMaps = map;
        $scope.group_id = $scope.groupMaps.groupname;
        $scope.apNameMap = $scope.groupMaps.map;
        $scope.revApNameMap = {};
        for(var key in $scope.apNameMap){
          $scope.revApNameMap[$scope.apNameMap[key].apid] = $scope.apNameMap[key].name;
        }
        $scope.mapData = $scope.groupMaps.data;
        $scope.settingsJSON = angular.copy($scope.mapData);
        if(!$scope.mapData.invalid){
          var builtMap = gmapMaker.buildMap($scope.mapData);
          $scope.firstFloorMapType = builtMap.mapType;
        }
      };

      var pendingChangePoll = $interval(checkForPendingChanges, 1000);
      //make sure to cancel the interval when the controller is destroyed
      $scope.$on('$destroy', function(){ $interval.cancel(pendingChangePoll);});
      function checkForPendingChanges(){
        $scope.updateMarkers();
        $scope.pendingChanges = !deepCompare($scope.settingsJSON, $scope.mapData);
      };

      $scope.onClick = function(event) {
        var ll = event.latLng;
        if(!$scope.isDeleteMode && !$scope.isZoneMode){
          $scope.showLocation = true;
          $scope.infobox.open($scope.map);
          $scope.infobox.setPosition(ll);
          $scope.infobox
            .setContent('<div>Lat: '+ ll.lat() + '</div>' + 
                '<div>Lng: '+ ll.lng() + '</div>');
        }else if($scope.isZoneMode){
          $scope.addZoneBoundary(ll);
        }
        if($scope.isScaleMode){
          $scope.scaleArr.push(ll);
        }
        if($scope.measureMode){
          $scope.distArr.push(ll);
        }
        if($scope.wallMode){
          $scope.wallArr.getPath().push(ll);
        }
      };

      $scope.enterWallMode = function(){
        if($scope.markersVisible){
          $scope.turnMarkersOff();
        }
        $scope.toggleZones('hide');
        if($scope.boundPoly){
          $scope.boundPoly.setVisible(false);
        }
        if($scope.minMaxPoly){
          $scope.minMaxPoly.setVisible(false);
        }
        $scope.wallArr = gmapMaker.newPoly('#FFFFFF');
        $scope.wallArr.setMap($scope.map);
        $scope.addWallMarkers();
        $scope.wallModeWatch = $scope.$watch(
          function(){
            if($scope.wallArr){
              return $scope.wallArr.getPath().getArray().length;
            }else{
              return 0;
            }
          },
          function(newVal){
            if(newVal === 2){
              $scope.exitWallMode(true);
            }
          }
        );
        $scope.wallMode = true;
      };

      $scope.exitWallMode = function(successful){
        if($scope.markersVisible){
          $scope.turnMarkersOn();
        }
        $scope.toggleZones('show');
        if($scope.boundPoly){
          $scope.boundPoly.setVisible(true);
        }
        if($scope.minMaxPoly){
          $scope.minMaxPoly.setVisible(true);
        }
        if(successful){
          $scope.updateWalls();
        }
        $scope.wallModeWatch();
        $scope.wallArr = null;
        $scope.removeWallMarkers();
        $scope.wallMode = false;
      };

      $scope.updateWalls = function(){
        var wall = $scope.wallArr.getPath().getArray();
        if(wall.length !== 2){
          return;
        }else{
          if(!$scope.walls){
            $scope.walls = [];
          }
          $scope.walls.push($scope.wallArr);
          $scope.updateMarkers();
        }
      };

      $scope.addWallMarkers = function(){
        $scope.wallMarkers = [];
        for(var i in $scope.walls){
          var wallPoints = $scope.walls[i].getPath().getArray();
          for(var p in wallPoints){
            var marker = new google.maps.Marker({
              position: wallPoints[p],
              map: $scope.map,
              title: 'Wall Marker',
              draggable: false,
              icon: 'images/here.png',
            });
            google.maps.event.addListener(marker, 'click', $scope.addWallPoint);
            $scope.wallMarkers.push(marker);
          }
        }
      };

      $scope.removeWallMarkers = function(){
        for(var marker in $scope.wallMarkers){
          $scope.wallMarkers[marker].setMap(null);
        }
        delete $scope.wallMarkers;
      };

      $scope.addWallPoint = function(event){
        var ll = event.latLng;
        $scope.wallArr.getPath().push(ll);
      };
       
      $scope.disableButtons = function(){
        return $scope.wallMode || $scope.measureMode || $scope.isScaling || $scope.isDeleteMode || $scope.isZoneMode;
      };

      $scope.changeScaleFactor = function(){
        $scope.isScaleMode = true;
        $scope.isScaling = true;
        $scope.scaleArr = [];
        $scope.scaleWatch = $scope.$watch(function(){if($scope.scaleArr){return $scope.scaleArr.length;}else{return 0;}},
            function(newVal){if(newVal === 2){$scope.isScaleMode = false; $scope.pickScale = true;}});
      };

      $scope.cancelScaleMode = function(){
        $scope.scaleWatch();
        $scope.isScaleMode = false;
        $scope.isScaling = false;
        $scope.measureMode = false;
        $scope.distArr = [];
        $scope.pickScale = false;
        $scope.scaleArr = [];
        $scope.scaleDist = null;
      };

      $scope.distMeasure = function(){
        $scope.measureMode = true;
        $scope.distArr = [];
        $scope.scaleWatch = $scope.$watch(function(){if($scope.distArr){return $scope.distArr.length;}else{return 0;}},
            function(newVal){if(newVal === 2){$scope.measureMode = false; calcDist()}});
      };

      function calcDist(){
        var latDelta = Math.abs($scope.distArr[0].lat() - $scope.distArr[1].lat());
        var lngDelta = Math.abs($scope.distArr[0].lng() - $scope.distArr[1].lng());
        $scope.distance = Math.round(($scope.settingsJSON.scale * Math.sqrt(Math.pow(latDelta,2) + Math.pow(lngDelta,2))) * 1000) / 1000;
        $scope.justCalcDist = true;
      }

      $scope.calcScale = function(){
        $scope.pickScale = false;
        var latDelta = Math.abs($scope.scaleArr[0].lat() - $scope.scaleArr[1].lat());
        var lngDelta = Math.abs($scope.scaleArr[0].lng() - $scope.scaleArr[1].lng());
        if($scope.euclideanScale){
          $scope.settingsJSON.scale = Math.round(($scope.scaleDist / Math.sqrt(Math.pow(latDelta,2) + Math.pow(lngDelta,2))) * 1000) / 1000;
        }else{  
          if(latDelta > lngDelta){
            $scope.settingsJSON.scale = Math.round(($scope.scaleDist / latDelta) * 1000) / 1000;
          }else{
            $scope.settingsJSON.scale = Math.round(($scope.scaleDist / lngDelta) * 1000) / 1000;
          }
        }
        $scope.scaleWatch();
        $scope.justSetScale = true;
        $scope.isScaling = false;
        delete $scope.scaleDist;
      };

      $scope.toggleMarkers = function(){
        if($scope.markersVisible){
          $scope.turnMarkersOff();
          $scope.markersVisible = false;
        }else{
          $scope.turnMarkersOn();
          $scope.markersVisible = true;
        }
      };

      $scope.toggleZones = (function(){
        var zonesVisible = true;
        return function(hideZones){
          if(!hideZones){
            zonesVisible = !zonesVisible;
            for(var zone in $scope.map.polygons){
              $scope.map.polygons[zone].setVisible(zonesVisible);
            }
          }else if(hideZones === 'show'){
            for(var zone in $scope.map.polygons){
              $scope.map.polygons[zone].setVisible(zonesVisible);
            }
          }else if (hideZones === 'hide'){
            for(var zone in $scope.map.polygons){
              $scope.map.polygons[zone].setVisible(false);
            }
          }
        };
      }());

      $scope.turnMarkersOn = function(){
        for(var marker in $scope.map.markers){
          $scope.map.markers[marker].setVisible(true);
        }
      };

      $scope.turnMarkersOff = function(){
        for(var marker in $scope.map.markers){
          $scope.map.markers[marker].setVisible(false);
        }
      };

      $scope.resetMapSettings = function(){
        for(var i in $scope.mapSettingsFields){
          $scope.mapSettingsFields[i] = angular.copy($scope.settingsJSON[i]);
        }
      };

      $scope.saveMapSettings = function(){
        for(var i in $scope.mapSettingsFields){
          $scope.settingsJSON[i] = angular.copy($scope.mapSettingsFields[i]);
        }
        if(angular.isString($scope.settingsJSON.minCoords)){
          var arr = $scope.settingsJSON.minCoords.split(',');
          $scope.settingsJSON.minCoords = [parseFloat(arr[0]), parseFloat(arr[1])];
        }
        if(angular.isString($scope.settingsJSON.maxCoords)){
          var arr2 = $scope.settingsJSON.maxCoords.split(',');
          $scope.settingsJSON.maxCoords = [parseFloat(arr2[0]), parseFloat(arr2[1])];
        }
      };

      $scope.addZone = function(){
        $scope.zone.name = '';
        $scope.zone.color = '';
        $scope.zone.type = undefined;
        $scope.turnMarkersOff();
        if($scope.settingsJSON.zones){
          for(var zone in $scope.settingsJSON.zones){
            zone = $scope.settingsJSON.zones[zone];
            for(var i in zone.bounds){
              var ll = new google.maps.LatLng(zone.bounds[i][0], zone.bounds[i][1]);
              $scope.addZoneBoundary(ll, true);
            }
          }
        }
        $scope.isZoneMode = true;
      };

      $scope.confirmZone = function(){
        $scope.isZoneMode = false;
        if(!$scope.isIntersecting()){
          $scope.createZones();
          $scope.updateZones();
        }else{
          $scope.closeAlerts();
          $scope.dangerAlert('Error: You can\'t overlap Zones!');
        }
        $scope.abortZone();
      };

      $scope.createZones = function(opts){
        if(!$scope.map.polygons){
          $scope.map.polygons = {};
        }
        var polygon = null;
        if(opts){
          polygon = gmapMaker.buildZone(opts, $scope.polyInfo);
        }else{
          var opts = {};
          opts.name = $scope.zone.color.name;
          opts.color = $scope.zone.color.name;
          opts.name = $scope.zone.name;
          opts.type = $scope.zone.type.name;
          opts.bounds = [];
          var array = $scope.poly.getPath().getArray();
          for(var i in array){
            opts.bounds.push([array[i].A, array[i].F]);
          }
          polygon = gmapMaker.buildZone(opts, $scope.polyInfo);
        }

        polygon.setMap($scope.map);
        $scope.map.polygons[polygon.title] = polygon;
        $scope.resetPoly();
        return polygon;
      };

      $scope.updateZones = function(){
        delete $scope.settingsJSON.zones;
        if($scope.map.polygons){
          $scope.settingsJSON.zones = {};
          for(var zone in $scope.map.polygons){
            zone = $scope.map.polygons[zone];
            var boundaries = [];
            var arr = zone.getPath().getArray();
            for(var i in arr){
              boundaries.push([Math.round(arr[i].lat() * 100) / 100, Math.round(arr[i].lng() * 100) / 100]);
            }
            $scope.settingsJSON.zones[zone.title] = {name: zone.title, color: zone.colorName, bounds: boundaries, type: zone.type};
          }
        }
      };

      $scope.macNameTaken = function(){
        if($scope.nameCheckDisabled){
          return false;
        }
        if($scope.settingsJSON && $scope.settingsJSON.fixedMacs && $scope.fixedMac){
          return !!$scope.settingsJSON.fixedMacs[$scope.fixedMac.name];
        }else{
          return false;
        }
      };

      $scope.nameTaken = function(){
        if($scope.settingsJSON && $scope.settingsJSON.zones && $scope.isZoneMode){
          return !!$scope.settingsJSON.zones[$scope.zone.name];
        }else{
          return false;
        }
      };

      $scope.saveFixedMac = function(){
        $scope.nameCheckDisabled = true;
        if(!$scope.settingsJSON.fixedMacs){
          $scope.settingsJSON.fixedMacs = {};
        }
        if(angular.isString($scope.fixedMac.position)){
          var arr = $scope.fixedMac.position.split(',');
          $scope.fixedMac.position = [parseFloat(arr[0]), parseFloat(arr[1])];
        }
        $scope.settingsJSON.fixedMacs[$scope.fixedMac.name] = { mac: $scope.fixedMac.mac, position: $scope.fixedMac.position, channel: $scope.fixedMac.channel };
        $scope.addMacMarker($scope.settingsJSON.fixedMacs[$scope.fixedMac.name], $scope.fixedMac.name);
      };

      $scope.resetFixedMac = function(){
        delete $scope.fixedMac;
      };

      $scope.deleteZone = function(zone){
        zone.setMap(null);
        zone.infoWindow.close();
        for(var poly in $scope.map.polygons){
          if(zone === $scope.map.polygons[poly]){
            delete $scope.map.polygons[poly];
            break;
          }
        }
        $scope.updateZones();
      };

      $scope.polyInfo = function(poly){
        return function(event){
          var ll = event.latLng;
          var contentString = '<b>' + poly.title + '</b><br>Type: '+  poly.type + '<br><a data-toggle="modal" data-target="#deleteZone'+ poly.title +'">Delete This Zone</a><br>';
          poly.infoWindow.setContent(contentString);
          poly.infoWindow.setPosition(ll);
          poly.infoWindow.open($scope.map);
        };
      };

      $scope.abortZone = function(){
        //clean up markers
        $scope.isZoneMode = false;
        setTimeout(function(){
          for(var marker in $scope.map.markers){
            if(marker.indexOf('zone') > -1 || marker.indexOf('holder') > -1){
             $scope.map.markers[marker].setMap(null); 
             delete $scope.map.markers[marker];
            }
          }
        }, 0);
        
        if($scope.markersVisible){
          $scope.turnMarkersOn();
        }
        //clean up polyline
        $scope.resetPoly();
      };

      $scope.numZoneMarkers = function(){
        if($scope.poly && $scope.isZoneMode){
          return $scope.poly.getPath().length < 3;
        }else{
          return false;
        }
      };

      $scope.addZoneBoundary = (function(){
        var zoneID = 0;
        return function(ll, noPoly){
          var image = 'images/here.png';
          var id = 'zone' + zoneID;
          if(noPoly){
            image = 'images/down.png';
            id = 'holder' + zoneID; 
          }
          var marker = new google.maps.Marker({
            position: ll,
            map: $scope.map,
            title: 'Zone Boundary',
            draggable: !noPoly,
            icon: image,
            id: id
          });
          $scope.map.markers[id] = marker;
          if(!noPoly){
            $scope.poly.getPath().push($scope.map.markers[id].getPosition());
            google.maps.event.addListener(marker, 'drag', $scope.updatePoly);
            google.maps.event.addListener(marker, 'dragend', $scope.updatePoly);
          }
          google.maps.event.addListener(marker, 'click', $scope.addBoundPoint);
          zoneID++;
        };
      }());

      $scope.addBoundPoint = function(event){
        var ll = event.latLng;
        $scope.poly.getPath().push(ll);
      };

      $scope.resetPoly = function(){
        if($scope.poly){
          $scope.poly.setMap(null);
          delete $scope.poly;
        }
        $scope.poly = gmapMaker.newPoly('#00CCFF');
        $scope.poly.setMap($scope.map);
      };

      $scope.updatePoly = function(){
        $scope.resetPoly();
        for(var i in $scope.map.markers){
          if(i.indexOf('zone') > -1){
            $scope.poly.getPath().push($scope.map.markers[i].getPosition());
          }
        }
      };

      $scope.resetBoundPoly = function(){
        if($scope.boundPoly){
          $scope.boundPoly.setMap(null);
          delete $scope.boundPoly;
        }
        $scope.boundPoly = gmapMaker.newPoly('#FF0000');
        $scope.boundPoly.setMap($scope.map);
      };

      $scope.updateBoundPoly = function(){
        $scope.resetBoundPoly();
        for(var i in $scope.map.markers){
          if(i.indexOf('boundary') > -1){
            $scope.boundPoly.getPath().push($scope.map.markers[i].getPosition());
          }
        }
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
      };

      $scope.addMacMarker = function(mac,name){
        var myLatlng = new google.maps.LatLng(mac.position[0],mac.position[1]);
        var marker = new google.maps.Marker(
        {
          position: myLatlng,
          map: $scope.map,
          title: 'Fixed Wifi Device: ' + name + '\nMac: ' + mac.mac + '\nChannel: ' + mac.channel,
          draggable: true,
          icon: 'images/red-wifi.png',
          id: 'macMarker' + name,
          mac: mac.mac,
          channel: mac.channel
        });
        $scope.map.markers['macMarker'+ name] = marker;
        $scope.updateMarkers();
      };

      $scope.addBoundary = (function(){
      
        //create id counter in private scope  
        var boundID = 0;
          
        return function(coords){
          var lat = $scope.mapData.centerX;
          var lng = $scope.mapData.centerY;
          if(coords){
            lat = coords[0];
            lng = coords[1];
          }
          var myLatlng = new google.maps.LatLng(lat,lng);
          var marker = new google.maps.Marker(
          {
            position: myLatlng,
            map: $scope.map,
            title: 'Boundary Marker',
            draggable: true,
            icon: 'images/boundary.png',
            id: 'boundary' + boundID
          });
          $scope.map.markers['boundary'+ boundID] = marker;
          $scope.boundPoly.getPath().push($scope.map.markers['boundary' + boundID].getPosition());
          google.maps.event.addListener(marker, 'drag', $scope.updateBoundPoly);
          google.maps.event.addListener(marker, 'dragend', $scope.updateBoundPoly);
          $scope.updateMarkers();
          $scope.updateBoundPoly();
          boundID++;
        };
      }());

      $scope.toggleDeleteMode = function(){
        $scope.isDeleteMode = !$scope.isDeleteMode;
        if($scope.isDeleteMode){
          for(var marker in $scope.map.markers){
            if(marker !== 'syncMarker' && marker.indexOf('apid') === -1){
              google.maps.event.addListener($scope.map.markers[marker], 'click', removeMarkerFnc($scope.map.markers[marker]));
            }
          }
          for(var wall in $scope.walls){
            google.maps.event.addListener($scope.walls[wall], 'click', removeWallFnc($scope.walls[wall]));
          }
        }
      };

      function removeWallFnc(wall){

       return function(){
                if($scope.isDeleteMode){
                  wall.setMap(null);
                  for(var i in $scope.walls){
                    if($scope.walls[i] === wall){
                     $scope.walls.splice(i,1);
                    }
                  }
                  $scope.updateMarkers();
                }
              };
      }

      function removeMarkerFnc(marker){

       return function(){
                if($scope.isDeleteMode){
                  $scope.updateMarkers();
                  marker.setMap(null);
                  delete $scope.map.markers[marker.id];
                  $scope.updateMarkers();
                  $scope.updateBoundPoly();
                }
              };
      }

      $scope.updateMarkers = function() {
        $scope.settingsJSON.aps = [];
        $scope.settingsJSON.boundary = [];
        $scope.settingsJSON.fixedMacs = {};
        $scope.settingsJSON.walls = [];
        if($scope.map){
          for(var marker in $scope.map.markers){
            if(marker.indexOf('boundary') > -1 ){
              //boundary marker
              var boundary = [Math.round($scope.map.markers[marker].getPosition().lat() * 100) /100, Math.round($scope.map.markers[marker].getPosition().lng() * 100) / 100 ];
              $scope.settingsJSON.boundary.push(boundary);
            }else if(marker.indexOf('apid') > -1){
              //ap marker
              marker = {apid: marker.substring(4), lat: Math.round($scope.map.markers[marker].getPosition().lat() * 100) /100, lng: Math.round($scope.map.markers[marker].getPosition().lng() * 100) /100 };
              $scope.settingsJSON.aps.push(marker);
            }else if(marker === 'syncMarker'){
              $scope.settingsJSON.syncCoords = [ Math.round($scope.map.markers[marker].getPosition().lat() * 100) / 100, Math.round($scope.map.markers[marker].getPosition().lng() * 100) / 100 ];
            }else if(marker.indexOf('macMarker') > -1){
              $scope.settingsJSON.fixedMacs[marker.substring(9)] = {};
              $scope.settingsJSON.fixedMacs[marker.substring(9)].position = [ Math.round($scope.map.markers[marker].getPosition().lat() * 100) / 100, Math.round($scope.map.markers[marker].getPosition().lng() * 100) / 100 ];
              $scope.settingsJSON.fixedMacs[marker.substring(9)].mac = $scope.map.markers[marker].mac;
              $scope.settingsJSON.fixedMacs[marker.substring(9)].channel = $scope.map.markers[marker].channel;
            }

          }
          for(var i in $scope.walls){
            var wall = $scope.walls[i].getPath().getArray();
            var newWall = [];
            newWall.push([Math.round(wall[0].lat() * 100) / 100, Math.round(wall[0].lng()*100)/100]);
            newWall.push([Math.round(wall[1].lat() * 100) / 100, Math.round(wall[1].lng()*100)/100]);
            if(!$scope.settingsJSON.walls){
              $scope.settingsJSON.walls = [];
            }
            $scope.settingsJSON.walls.push(newWall);
          }
        }
      };

      $scope.submitChanges = function(){
        $scope.confirmZone = false;
        $scope.updateMarkers();
        var body = {
          sessionToken: $scope.sessionToken(),
          reconid: $scope.groupMaps.reconid,
          typeid: $scope.groupMaps.data.typeid,
          newdata: $scope.settingsJSON
        };
        var url = URLS.current + 'recon/maps/update';
        $http.post(url, body).then(
            //success
            function(){
            },
            //error
            function(){
              $scope.closeAlerts();
              $scope.dangerAlert('Error saving changes to database.');
            }
        );
        $route.reload();
      };

      $scope.isIntersecting = function(){
        var boundaries = [];
        var arr = $scope.poly.getPath().getArray();
        for(var i in arr){
          boundaries.push([Math.round(arr[i].lat() * 100) / 100, Math.round(arr[i].lng() * 100) / 100]);
        }
        if($scope.settingsJSON.zones){
          for(var zone in $scope.settingsJSON.zones){
            for(var bound in $scope.settingsJSON.zones[zone].bounds){
              var lat = $scope.settingsJSON.zones[zone].bounds[bound][0];
              var lng = $scope.settingsJSON.zones[zone].bounds[bound][1];
              var test = true;
              for(i in boundaries){
                if( lat === boundaries[i][0] && lng === boundaries[i][1]){
                  //if they're the same point we don't care
                  test = false;
                }
              }
              if(test){
                if($scope.coordsInside(lat, lng , boundaries)){
                  console.log('CONFLICT!!! prexisting marker in new zone');
                  return true;
                }
              }
            }
          }
        }
        return false;
      };

      $scope.coordsInside = function(lat, lng, boundary) {
        var i, j;
        var x = 0;
        var y = 1;
        var c = false;
        // DFW: got this alg from here: http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        for (i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
          if( ((boundary[i][y] > lng) !== (boundary[j][y] > lng)) &&
            (lat < (boundary[j][x] - boundary[i][x]) * (lng - boundary[i][y]) / (boundary[j][y] - boundary[i][y]) + boundary[i][x])) {
            c = !c;
          }
        }
        return c;
      };

      function deepCompare () {
        var i, l, leftChain, rightChain;

        function compare2Objects (x, y) {
          var p;

          // remember that NaN === NaN returns false
          // and isNaN(undefined) returns true
          if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
               return true;
          }

          // Compare primitives and functions.     
          // Check if both arguments link to the same object.
          // Especially useful on step when comparing prototypes
          if (x === y) {
              return true;
          }

          // Works in case when functions are created in constructor.
          // Comparing dates is a common scenario. Another built-ins?
          // We can even handle functions passed across iframes
          if ((typeof x === 'function' && typeof y === 'function') ||
             (x instanceof Date && y instanceof Date) ||
             (x instanceof RegExp && y instanceof RegExp) ||
             (x instanceof String && y instanceof String) ||
             (x instanceof Number && y instanceof Number)) {
              return x.toString() === y.toString();
          }

          // At last checking prototypes as good a we can
          if (!(x instanceof Object && y instanceof Object)) {
              return false;
          }

          if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
              return false;
          }

          if (x.constructor !== y.constructor) {
              return false;
          }

          if (x.prototype !== y.prototype) {
              return false;
          }

          // Check for infinitive linking loops
          if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
               return false;
          }

          // Quick checking of one object beeing a subset of another.
          // todo: cache the structure of arguments[0] for performance
          for (p in y) {
              if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                  return false;
              }
              else if (typeof y[p] !== typeof x[p]) {
                  return false;
              }
          }

          for (p in x) {
              if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                  return false;
              }
              else if (typeof y[p] !== typeof x[p]) {
                  return false;
              }

              switch (typeof (x[p])) {
                  case 'object':
                  case 'function':

                      leftChain.push(x);
                      rightChain.push(y);

                      if (!compare2Objects (x[p], y[p])) {
                          return false;
                      }

                      leftChain.pop();
                      rightChain.pop();
                      break;

                  default:
                      if (x[p] !== y[p]) {
                          return false;
                      }
                      break;
              }
          }

          return true;
        }

        if (arguments.length < 1) {
          return true; //Die silently? Don't know how to handle such case, please help...
          // throw "Need two or more arguments to compare";
        }

        for (i = 1, l = arguments.length; i < l; i++) {

            leftChain = []; //Todo: this can be cached
            rightChain = [];

            if (!compare2Objects(arguments[0], arguments[i])) {
                return false;
            }
        }

        return true;
      }

  }]);
