'use strict';

/**
 * @ngdoc service
 * @name paradropApp.gmapMaker
 * @description
 * # gmapMaker
 * Factory in the paradropApp.
 */
angular.module('paradropApp')
  .factory('gmapMaker', function () {
    // Service logic
    // ...
    var colorNames = {
        BLUE: { code:'#0000FF'},
        YELLOW: { code:'#FFFF00'},
        RED: { code:'#FF0000'},
        GREEN: { code:'#008000'},
        PURPLE: { code:'#800080'},
        ORANGE: { code:'#FFA500'},
        LIME: { code:'#00FF00'},
        BLACK: { code:'#000000'},
    };

    var gmapFuncs = {};

    // Public API here
    gmapFuncs.buildMap = function(mapData) {
      var gotMap = false;
      var currMapTile = '';

      function getNormalizedCoord(coord, zoom) {
        var y = coord.y;
        var x = coord.x;
        //console.log('X: ' + x + ' Y: ' + y + ' ZOOM: ' + zoom);

        // tile range in one direction range is dependent on zoom level
        // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
        var tileRange = 1 << zoom;
        console.log(tileRange);

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
      var newMap = {};
      newMap.onClick = function(event) {
          var ll = event.latLng;
          console.log('Lat: ' + ll.lat(), ' Lng: ' + ll.lng());
          //$scope.positions.push({lat: ll.lat(), lng: ll.lng()});
          //$scope.map.markers[$scope.markers.length].setMap($scope.map);
      };

      //Create the Options required to change the MapType
      var TypeOptions = {
            getTileUrl: function(coord, zoom) {
                //var normalizedCoord = getNormalizedCoord(coord, zoom);
                //console.log(normalizedCoord);
                //if (!normalizedCoord) {
                //  return null;
                //}
                //
                /*
                if(gotMap === false) {
                  //console.log('Returning one map');
                  gotMap = true;
                  currMapTile = coord.toString()
                  return mapData.url;
                } else 
                */
                if(coord.toString() ===  mapData.imageTile) {
                  console.log('getting original map tile');
                  console.log(coord.toString());
                  return mapData.url;;
                }else{
                  return null;
                }
            },
            tileSize: new google.maps.Size(mapData.tileSizeX, mapData.tileSizeY),
            maxZoom: 7,//mapData.maxZoom,
            minZoom: mapData.minZoom,
            radius: mapData.radius,
            name: mapData.name
      };

      newMap.mapType = new google.maps.ImageMapType(TypeOptions);
      return newMap; 
    };

    gmapFuncs.buildHeatmap = function(offset){
      if(!offset){
        offset = 0;
      }
      var genFakeMarkers = function(cnt, noise) {
        var markers = [];
        var hotspots = [
          [-20, -40 + offset],
          [-20, -53 + offset],
          [-10, -33 + offset],
          [-10, -45 + offset],
          [-25, -45 + offset],
          [-28.5, -36 + offset],
          [-26, -49 + offset],
          [-20, -33 + offset]
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
      };
      var heatMapData = [];
      var fakes = genFakeMarkers(100, 5);
      for(var i in fakes){
        heatMapData.push(new google.maps.LatLng(fakes[i][0],fakes[i][1]));
      }
      return heatMapData; 
    };

    var storedIndex = { calibrate: 0, localization: 0, recon: 0, settings: 0, adminSettings: 0};
    gmapFuncs.setIndex = function(index, page){
        storedIndex[page] = index;
    };

    gmapFuncs.getIndex = function(page){
      return storedIndex[page];
    };

    gmapFuncs.buildZone = function(zone, infoFunc){
      var colorName = '';
      var color = '';
      var name = '';
      var type = '';
      var tmpPoly = gmapFuncs.newPoly();
      for(var i in zone.bounds){
        tmpPoly.getPath().push(new google.maps.LatLng(zone.bounds[i][0], zone.bounds[i][1]));
      }
      colorName = zone.color;
      color = colorNames[zone.color].code;
      name = zone.name;
      type = zone.type;
      var paths = tmpPoly.getPath();
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
        title: name
      });
      if(infoFunc){
        polygon.infoWindow = new google.maps.InfoWindow();
        google.maps.event.addListener(polygon, 'click', infoFunc(polygon));
      }

      return polygon;
    };

    gmapFuncs.newPoly = function(color, info){
        if(!color){
          //random color
          color = '#'+ ('000000' + (Math.random()*0xFFFFFF<<0).toString(16)).slice(-6);
        }
        var polyOptions = {
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 5,
          clickable: true,
          draggable: false,
          //infoWindow: new google.maps.InfoWindow()
        };
        if(info){
          for(var key in info){
            polyOptions[key] = info[key];
          }
        }

        var poly = new google.maps.Polyline(polyOptions);
        //google.maps.event.addListener(poly, 'click', $scope.polyInfo(poly));
        return poly;
      };

    gmapFuncs.buildWalls = function(walls){
      var wallPolys = [];
      for(var wall in walls){
        var newWall = gmapFuncs.newPoly('#FFFFFF');
        newWall.getPath().push(new google.maps.LatLng(walls[wall][0][0],walls[wall][0][1]));
        newWall.getPath().push(new google.maps.LatLng(walls[wall][1][0],walls[wall][1][1]));
        wallPolys.push(newWall);
      }
      return wallPolys;
    };

    return gmapFuncs;
  });
