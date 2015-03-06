'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MapSettingsCtrl
 * @description
 * # MapSettingsCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MapSettingsCtrl',['$scope', 'URLS', '$http', '$sce', '$routeParams', 'gmapMaker', '$route',
    function ($scope, URLS, $http, $sce, $routeParams, gmapMaker, $route) {
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
                console.log($scope.mapsArray);
                for(var i in $scope.mapsArray){
                  if($scope.mapsArray[i].groupname == $scope.group_id){
                    $scope.groupMaps = $scope.mapsArray[i];
                    break;
                  }
                }
                $scope.mapData = $scope.groupMaps.data;
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
                });
              }
          , function(error){$scope.mapError = true;});
        };
      });

      $scope.onClick = function(event) {
        var ll = event.latLng;
        if(!$scope.isDeleteMode && !$scope.isZoneMode){
          $scope.showLocation = true;
          $scope.infobox.open($scope.map);
          $scope.infobox.setPosition(ll);
          $scope.infobox
            .setContent('<div>Lat: '+ ll.lat() + '</div>'
                + '<div>Lng: '+ ll.lng() + '</div>');
        }else if($scope.isZoneMode){
          $scope.addZoneBoundary(ll);
        }
      };

      var isVisible = true;
      $scope.toggleMarkers = function(){
        isVisible = !isVisible;
        for(var marker in $scope.map.markers){
          $scope.map.markers[marker].setVisible(isVisible);
        }
      };

      $scope.addZone = function(){
        $scope.zone.name = '';
        $scope.zone.color = '';
        $scope.toggleMarkers();
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

      $scope.acceptZone = function(){
        setTimeout($scope.confirmZone, 0);
      };

      $scope.confirmZone = function(){
        if(!$scope.isIntersecting()){
          var polygon = $scope.createPolygon();
          setTimeout(function(){$scope.updateZones();}, 0);
        }else{
          alert('You can\'t overlap Zones!');
        }
        $scope.abortZone();
      };

      $scope.createPolygon = function(){
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
            };
            colorName = opts.color;
            console.log(colorName);
            color = $scope.colorName[opts.color].code;
            name = opts.name;
            type = opts.type;
          }else{
            colorName = $scope.zone.color.name;
            console.log($scope.colorName);
            console.log($scope.zone.color);
            color = $scope.colorName[$scope.zone.color.name].code;
            name = $scope.zone.name;
            type = $scope.zone.type;
          }
          var paths = $scope.poly.getPath();
          console.log(paths);
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
      }();

      $scope.updateZones = function(){
        delete $scope.settingsJSON.zones;
        if($scope.map.polygons){
          $scope.settingsJSON.zones = {};
          for(var zone in $scope.map.polygons){
            zone = $scope.map.polygons[zone];
            var color = '';
            var boundaries = [];
            var arr = zone.getPath().j;
            for(var i in arr){
              boundaries.push([Math.round(arr[i].k * 100) / 100, Math.round(arr[i].D * 100) / 100]);
            }
            $scope.settingsJSON.zones[zone.title] = {name: zone.title, color: zone.colorName, bounds: boundaries, type: zone.type.name};
          };
        }
        console.log($scope.settingsJSON.zones);
      };

      $scope.nameTaken = function(){
        if($scope.settingsJSON && $scope.settingsJSON.zones){
          return !!$scope.settingsJSON.zones[$scope.zone.name];
        }else{
          return false;
        }
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
        console.log($scope.map.polygons);
        console.log($scope.settingsJSON);
      };

      $scope.polyInfo = function(poly){
        return function(event){
          var ll = event.latLng;
          var contentString = '<b>' + poly.title + '</b><br><a data-toggle="modal" data-target="#deleteZone'+ poly.id +'">Delete This Zone</a><br>';
          poly.infoWindow.setContent(contentString);
          poly.infoWindow.setPosition(ll);
          poly.infoWindow.open($scope.map);
        };
      };

      $scope.abortZone = function(){
        //clean up markers
        setTimeout(function(){
          for(var marker in $scope.map.markers){
            if(marker.indexOf('zone') > -1 || marker.indexOf('holder') > -1){
             $scope.map.markers[marker].setMap(null); 
             delete $scope.map.markers[marker];
            }
          }
        }, 0);
        
        $scope.toggleMarkers();
        //clean up polyline
        $scope.resetPoly();
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

      $scope.addZoneBoundary = function(){
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
      }();

      $scope.newPoly = function(color){
        if(!color){
          color = '#00CCFF';
        }
        var polyOptions = {
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 3
        };

        var poly = new google.maps.Polyline(polyOptions);
        return poly;
      }

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

      $scope.addBoundary = function(){
      
        //create id counter in private scope  
        var boundID = 0;
          
        return function(coords){
          var lat = -19;
          var lng = -40;
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
        }
      }();

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
                  $scope.updateBoundPoly();
                  console.log($scope.settingsJSON);
                }
              };
      };

      $scope.updateMarkers = function() {
        $scope.settingsJSON.aps = [];
        $scope.settingsJSON.boundary = [];
        for(var marker in $scope.map.markers){
          if(marker.indexOf('boundary') > -1 ){
            //boundary marker
            var boundary = [Math.round($scope.map.markers[marker].position.k * 100) /100, Math.round($scope.map.markers[marker].position.D * 100) / 100 ];
            $scope.settingsJSON.boundary.push(boundary);
          }else if(marker.indexOf('apid') > -1){
            //ap marker
            var marker = {apid: marker.substring(4), lat: $scope.map.markers[marker].position.k, lng: $scope.map.markers[marker].position.D };
            $scope.settingsJSON.aps.push(marker);
          }
        }
       //console.log($scope.settingsJSON);
       // console.log('******************');
      };

      $scope.submitChanges = function(){
        $scope.confirmZone = false;
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
        var body = {
          sessionToken: $scope.sessionToken(),
          reconid: $scope.groupMaps.reconid,
          typeid: $scope.groupMaps.data.typeid,
          newdata: $scope.settingsJSON
        };
        var url = URLS.current + 'recon/maps/update';
        $http.post(url, body).then(
            //success
            function(success){
              console.log(success);
            },
            //error
            function(error){
              console.log(error);
              alert('Error saving changes to database.');
            }
        );
        console.log(body);
        $route.reload();
      };

      $scope.isIntersecting = function(){
        var boundaries = [];
        var arr = $scope.poly.getPath().j;
        for(var i in arr){
          boundaries.push([arr[i].k, arr[i].D]);
        }
        if($scope.settingsJSON.zones){
          for(var zone in $scope.settingsJSON.zones){
            for(var bound in $scope.settingsJSON.zones[zone].bounds){
              var lat = $scope.settingsJSON.zones[zone].bounds[bound][0];
              var lng = $scope.settingsJSON.zones[zone].bounds[bound][1];
              var test = true;
              for(var i in boundaries){
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
        //console.log('BOUNDARY: testing (%s, %s)', lat, lng);
        var i, j;
        var x = 0;
        var y = 1;
        var c = false;
        // DFW: got this alg from here: http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        for (i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
          if( ((boundary[i][y] > lng) != (boundary[j][y] > lng)) &&
            (lat < (boundary[j][x] - boundary[i][x]) * (lng - boundary[i][y]) / (boundary[j][y] - boundary[i][y]) + boundary[i][x])) {
            c = !c;
          }
        }
        return c;
      };
  }]);
