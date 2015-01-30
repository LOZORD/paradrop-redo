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

    var gmapFuncs = {};

    // Public API here
    gmapFuncs.buildMap = function(mapData) {
      var gotMap = false;

      function getNormalizedCoord(coord, zoom) {
        var y = coord.y;
        var x = coord.x;
        //console.log('X: ' + x + ' Y: ' + y + ' ZOOM: ' + zoom);

        // tile range in one direction range is dependent on zoom level
        // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
        var tileRange = 1 << zoom;

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
      }
      //The PNG image itself is 2104 x 1641
      //center of bookstore: center="[43.074675, -89.397898]" 

      //Create the Options required to change the MapType
      var TypeOptions = {
            getTileUrl: function(coord, zoom) {
                var normalizedCoord = getNormalizedCoord(coord, zoom);
                if (!normalizedCoord) {
                  return null;
                }
                if(gotMap === false) {
                  //console.log('Returning one map');
                  gotMap = true;
                  return mapData.url;
                } else {
                  return null;
                }
            },
            tileSize: new google.maps.Size(mapData.tileSizeX, mapData.tileSizeY),
            maxZoom: mapData.maxZoom,
            minZoom: mapData.minZoom,
            radius: mapData.radius,
            name: mapData.name
      };

      newMap.mapType = new google.maps.ImageMapType(TypeOptions);
      return newMap; 
    };

    gmapFuncs.buildHeatmap = function(data){
      var genFakeMarkers = function(cnt, noise) {
        var markers = [];
        var hotspots = [
          [-20, -40],
          [-20, -53],
          [-10, -33],
          [-10, -45],
          [-25, -45],
          [-28.5, -36],
          [-26, -49],
          [-20, -33]
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
      }
      var heatMapData = [];
      var fakes = genFakeMarkers(100, 5);
      for(var i in fakes){
        heatMapData.push(new google.maps.LatLng(fakes[i][0],fakes[i][1]));
      }
      return heatMapData; 
    };

    return gmapFuncs;
  });
