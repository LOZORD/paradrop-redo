'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:LocalizationCtrl
 * @description
 * # LocalizationCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('LocalizationCtrl',['$scope', 'URLS', '$http', '$sce', '$route', 'gmapMaker',
    function ($scope, URLS, $http, $sce, $route, gmapMaker) {
      $scope.authorizePage()
      .then(function(authorized){
        if(authorized){

          //grab map and build!
          var body = { sessionToken: $scope.sessionToken() };
          var localURL = URLS.current + 'recon/readjson'
          $http.post(localURL, body ).then(
              function(json){
                $scope.array = json.data;
                $scope.buildHeatMap();
              }
          ).then(function(){
            var mapInitURL = URLS.current + 'recon/maps/init';
            var postBody = { sessionToken: $scope.sessionToken() };
            $http.post(mapInitURL, postBody ).then(
                function(groupMaps){
                  $scope.mapsArray = groupMaps.data;
                  $scope.setMap($scope.mapsArray[gmapMaker.getIndex('localization')]);
                  $scope.$on('mapInitialized', function(event, map) {
                    $scope.heatmap = map.heatmapLayers.heatmap;
                    $scope.map = map;
                    $scope.heatmap.set('radius', 40);
                    setTimeout(function(){$scope.changeMarkers();}, 0);
                  });
                }
            , function(error){$scope.mapError = true;});
          });

        } 
      var i = 0;
      $scope.prevPoint = function(){
        i--;
        if(i < 0){
          i = $scope.array.length -1;
        }
        $scope.changeMarkers();
        $scope.buildHeatMap();
        $scope.setHeatMap();
      }

      $scope.changeMarkers = function(){
        for(var key in $scope.map.markers){
          if(key === 'actualLocation' || key === 'predictedLocation'){
            //Nothing
          }else{
            if($scope.array[i].rssi[key]){
              var strength = $scope.array[i].rssi[key];
              if(strength > -65){
                $scope.map.markers[key].set('visible', true);
                $scope.map.markers[key].setIcon('images/green-signal.png');
              }else if(strength > -85){
                $scope.map.markers[key].set('visible', true);
                $scope.map.markers[key].setIcon('images/yellow-signal.png');
              }else{
                $scope.map.markers[key].set('visible', true);
                $scope.map.markers[key].setIcon('images/red-signal.png');
              }
            }else{
                $scope.map.markers[key].set('visible', false);
            }
          }
        }
      }

      $scope.switchMap = function(index){
        gmapMaker.setIndex(index, 'localization');
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
              gmapMaker.setIndex(i, 'localization');
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
        if(!$scope.mapData.invalid){
          var builtMap = gmapMaker.buildMap($scope.mapData);
          $scope.firstFloorMapType = builtMap.mapType;
          $scope.onClick = builtMap.onClick;
        }
      };

      $scope.nextPoint = function(){
        i++;
        if(i >= $scope.array.length){
          i = 0;
        }
        $scope.changeMarkers();
        $scope.buildHeatMap();
        $scope.setHeatMap();
      }

      $scope.buildHeatMap = function(){
        $scope.heatMapData = [];
        for(var point in $scope.array[i].heatmap){
          $scope.heatMapData
            .push(
              {
                location: new google.maps
                  .LatLng($scope.array[i].heatmap[point][0],
                          $scope.array[i].heatmap[point][1]),
                weight: $scope.array[i].heatmap[point][2]
              }
            );
        }
        $scope.real = {lat: $scope.array[i].true_coord[0], lng: $scope.array[i].true_coord[1]};
        $scope.pred = {lat: $scope.array[i].pred_coord[0], lng: $scope.array[i].pred_coord[1]};
      }

      $scope.setHeatMap = function(){
        $scope.heatmap.setMap(null);
        $scope.heatmap = new google.maps.visualization.HeatmapLayer({radius: 40, data: $scope.heatMapData});
        $scope.heatmap.setMap($scope.map);
      }
      });
}]);
