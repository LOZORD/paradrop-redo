'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MapSettingsCtrl
 * @description
 * # MapSettingsCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MapSettingsCtrl',['$scope', 'URLS', '$http', '$sce', 'gmapMaker', '$route','$routeParams',
    function ($scope, URLS, $http, $sce, gmapMaker, $route, $routeParams) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      if($scope.group_id){
        $scope.superAdmin = false;
      }else{
        $scope.superAdmin = true;
      }
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
      $scope.colorName = {
          BLUE: { code:'#0000FF'},
          YELLOW: { code:'#FFFF00'},
          RED: { code:'#FF0000'},
          GREEN: { code:'#008000'},
          PURPLE: { code:'#800080'},
          ORANGE: { code:'#FFA500'},
          LIME: { code:'#00FF00'},
          BLACK: { code:'#000000'},
      };
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
        maxCoords: null
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
                $scope.setMap($scope.mapsArray[gmapMaker.getIndex('settings')]);

                $scope.$on('mapInitialized', function(event, map) {
                  $scope.map = map;
                  $scope.infobox = new google.maps.InfoWindow();
                  $scope.map.setCenter(new google.maps.LatLng($scope.mapData.centerX, $scope.mapData.centerY));
                  $scope.boundPoly = $scope.newPoly('#FF0000');
                  for(var boundary in $scope.mapData.boundary){
                    $scope.addBoundary($scope.mapData.boundary[boundary]);
                  }
                  for(var ap in $scope.mapData.aps){
                    $scope.addAP($scope.mapData.aps[ap]);
                  }
                  $scope.updatePoly();
                  for(var zone in $scope.mapData.zones){
                    $scope.createPolygon($scope.mapData.zones[zone]);
                  }
                  for(var mac in $scope.mapData.fixedMacs){
                    $scope.addMacMarker($scope.mapData.fixedMacs[mac], mac);
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
                      icon: 'images/here.png',
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
        $scope.minMaxPoly = $scope.newPoly('#191970');
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.minCoords[0],$scope.mapData.minCoords[1]));
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.maxCoords[0],$scope.mapData.minCoords[1]));
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.maxCoords[0],$scope.mapData.maxCoords[1]));
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.minCoords[0],$scope.mapData.maxCoords[1]));
        $scope.minMaxPoly.getPath().push(new google.maps.LatLng($scope.mapData.minCoords[0],$scope.mapData.minCoords[1]));
        $scope.minMaxPoly.setMap($scope.map);
      };

      $scope.switchMap = function(index){
        gmapMaker.setIndex(index, 'settings');
        $route.reload();
      };

      $scope.setMap = function(map){
        if(map.data.invalid){
          for(var i in $scope.mapsArray){
            if($scope.mapsArray[i].data.invalid){
              continue;
            }else{
              map = $scope.mapsArray[i];
              gmapMaker.setIndex(i, 'settings');
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

      $scope.pendingChanges = function(){
        return !deepCompare($scope.settingsJSON, $scope.mapData);
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
      };

      $scope.changeScaleFactor = function(){
        $scope.isScaleMode = true;
        $scope.isScaling = true;
        $scope.scaleArr = [];
        $scope.$watch(function(){if($scope.scaleArr){return $scope.scaleArr.length;}else{return 0;}},
            function(newVal){if(newVal === 2){$scope.isScaleMode = false; $scope.pickScale = true;}});
      };

      $scope.calcScale = function(){
        $scope.pickScale = false;
        console.log($scope.settingsJSON.scale);
        var latDelta = Math.abs($scope.scaleArr[0].lat() - $scope.scaleArr[1].lat());
        var lngDelta = Math.abs($scope.scaleArr[0].lng() - $scope.scaleArr[1].lng());
        if(latDelta > lngDelta){
          $scope.settingsJSON.scale = Math.round(($scope.scaleDist / latDelta) * 1000) / 1000;
        }else{
          $scope.settingsJSON.scale = Math.round(($scope.scaleDist / lngDelta) * 1000) / 1000;
        }
        console.log($scope.settingsJSON.scale);
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
        return function(){
          zonesVisible = !zonesVisible;
          for(var zone in $scope.map.polygons){
            $scope.map.polygons[zone].setVisible(zonesVisible);
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
          console.log($scope.settingsJSON[i]);
          $scope.mapSettingsFields[i] = angular.copy($scope.settingsJSON[i]);
        }
        console.log($scope.mapSettingsFields);
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
        console.log($scope.mapSettingsFields);
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
          $scope.createPolygon();
          $scope.updateZones();
        }else{
          alert('You can\'t overlap Zones!');
        }
        $scope.abortZone();
      };

      $scope.createPolygon = (function(){
        var polyID = 0;
        return function(opts){
          if(!$scope.map.polygons){
            $scope.map.polygons = {};
          }
          var colorName = '';
          var color = '';
          var name = '';
          var type = '';
          if(opts){
            $scope.resetPoly();
            for(var i in opts.bounds){
              $scope.poly.getPath().push(new google.maps.LatLng(opts.bounds[i][0], opts.bounds[i][1]));
            }
            colorName = opts.color;
            color = $scope.colorName[opts.color].code;
            name = opts.name;
            type = opts.type;
          }else{
            colorName = $scope.zone.color.name;
            color = $scope.colorName[$scope.zone.color.name].code;
            name = $scope.zone.name;
            type = $scope.zone.type.name;
          }
          var paths = $scope.poly.getPath();
          // Construct the polygon.
          var polygon = new google.maps.Polygon({
            paths: paths,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.35,
            clickable: true,
            type: type,
            colorName: colorName,
            title: name,
            id: polyID,
            infoWindow: new google.maps.InfoWindow()
          });
          google.maps.event.addListener(polygon, 'click', $scope.polyInfo(polygon));

          polygon.setMap($scope.map);
          $scope.map.polygons['polygon' + polyID] = polygon;
          polyID++;
          $scope.resetPoly();
          return polygon;
        };
      }());

      $scope.updateZones = function(){
        delete $scope.settingsJSON.zones;
        if($scope.map.polygons){
          $scope.settingsJSON.zones = {};
          for(var zone in $scope.map.polygons){
            zone = $scope.map.polygons[zone];
            var boundaries = [];
            var arr = zone.getPath().j;
            for(var i in arr){
              boundaries.push([Math.round(arr[i].k * 100) / 100, Math.round(arr[i].D * 100) / 100]);
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
        $scope.settingsJSON.fixedMacs[$scope.fixedMac.name] = { mac: $scope.fixedMac.mac, position: $scope.fixedMac.position };
        $scope.addMacMarker($scope.settingsJSON.fixedMacs[$scope.fixedMac.name], $scope.fixedMac.name);
        console.log($scope.settingsJSON);
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
          var contentString = '<b>' + poly.title + '</b><br>Type: '+  poly.type + '<br><a data-toggle="modal" data-target="#deleteZone'+ poly.id +'">Delete This Zone</a><br>';
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
            $scope.poly.getPath().push($scope.map.markers[id].position);
            google.maps.event.addListener(marker, 'drag', $scope.updatePoly);
            google.maps.event.addListener(marker, 'dragend', $scope.updatePoly);
          }
          google.maps.event.addListener(marker, 'click', $scope.addBoundPoint);
          zoneID++;
        };
      }());

      $scope.newPoly = function(color){
        if(!color){
          color = '#00CCFF';
        }
        var polyOptions = {
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 3,
          clickable: false
        };

        var poly = new google.maps.Polyline(polyOptions);
        return poly;
      };

      $scope.addBoundPoint = function(event){
        var ll = event.latLng;
        $scope.poly.getPath().push(ll);
      };

      $scope.resetPoly = function(){
        if($scope.poly){
          $scope.poly.setMap(null);
          delete $scope.poly;
        }
        $scope.poly = $scope.newPoly();
        $scope.poly.setMap($scope.map);
      };

      $scope.updatePoly = function(){
        $scope.resetPoly();
        for(var i in $scope.map.markers){
          if(i.indexOf('zone') > -1){
            $scope.poly.getPath().push($scope.map.markers[i].position);
          }
        }
      };

      $scope.resetBoundPoly = function(){
        if($scope.boundPoly){
          $scope.boundPoly.setMap(null);
          delete $scope.boundPoly;
        }
        $scope.boundPoly = $scope.newPoly('#FF0000');
        $scope.boundPoly.setMap($scope.map);
      };

      $scope.updateBoundPoly = function(){
        $scope.resetBoundPoly();
        for(var i in $scope.map.markers){
          if(i.indexOf('boundary') > -1){
            $scope.boundPoly.getPath().push($scope.map.markers[i].position);
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
          title: 'Fixed Wifi Device: ' + name + '\nMac: ' + mac.mac,
          draggable: true,
          icon: 'images/red-wifi.png',
          id: 'macMarker' + name,
          mac: mac.mac
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
          $scope.boundPoly.getPath().push($scope.map.markers['boundary' + boundID].position);
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
        }
      };

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
        for(var marker in $scope.map.markers){
          if(marker.indexOf('boundary') > -1 ){
            //boundary marker
            var boundary = [Math.round($scope.map.markers[marker].position.k * 100) /100, Math.round($scope.map.markers[marker].position.D * 100) / 100 ];
            $scope.settingsJSON.boundary.push(boundary);
          }else if(marker.indexOf('apid') > -1){
            //ap marker
            marker = {apid: marker.substring(4), lat: Math.round($scope.map.markers[marker].position.k * 100) /100, lng: Math.round($scope.map.markers[marker].position.D * 100) /100 };
            $scope.settingsJSON.aps.push(marker);
          }else if(marker === 'syncMarker'){
            $scope.settingsJSON.syncCoords = [ Math.round($scope.map.markers[marker].position.k * 100) / 100, Math.round($scope.map.markers[marker].position.D * 100) / 100 ];
          }else if(marker.indexOf('macMarker') > -1){
            $scope.settingsJSON.fixedMacs[marker.substring(9)] = {};
            $scope.settingsJSON.fixedMacs[marker.substring(9)].position = [ Math.round($scope.map.markers[marker].position.k * 100) / 100, Math.round($scope.map.markers[marker].position.D * 100) / 100 ];
            $scope.settingsJSON.fixedMacs[marker.substring(9)].mac = $scope.map.markers[marker].mac;
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
              alert('Error saving changes to database.');
            }
        );
        $route.reload();
      };

      $scope.isIntersecting = function(){
        var boundaries = [];
        var arr = $scope.poly.getPath().j;
        for(var i in arr){
          boundaries.push([Math.round(arr[i].k * 100) / 100, Math.round(arr[i].D * 100) / 100]);
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
