'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:LocalizationCtrl
 * @description
 * # LocalizationCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('LocalizationCtrl',['$scope', 'URLS', '$http', '$sce', '$routeParams', 'gmapMaker',
    function ($scope, URLS, $http, $sce, $routeParams, gmapMaker) {
      $scope.group_id = 'State Street';
      $scope.authorizePage()
      .then(function(authorized){
        if(authorized){
          //default values
          $scope.showMarkers = true;
          $scope.markerBtnText = 'Hide';
          $scope.heatBtnText = 'Hide';
          //change toggle btn text
          $scope.changeText = function(hidden, markerBtn){
            if(!hidden){
              if(markerBtn){
                $scope.markerBtnText = 'Hide';
              }else{
                $scope.heatBtnText = 'Hide';
              }
            }else{
              if(markerBtn){
                $scope.markerBtnText = 'Show';
              }else{
                $scope.heatBtnText = 'Show';
              }
            }
          };
          //create a mapping
          $scope.apNameMap = {};
          for(var ap in $scope.currentUser().aps){
            $scope.apNameMap[$scope.currentUser().aps[ap].guid] = $scope.currentUser().aps[ap].name;
          }

          //grab map and build!
          var body = { sessionToken: $scope.sessionToken() };
          var localURL = URLS.current + 'recon/readjson'
          $http.post(localURL, body ).then(
              function(json){
                $scope.array = json.data;
                $scope.heatMapData = [];
                for(var point in $scope.array[0].heatmap){
                  $scope.heatMapData
                    .push(
                      {
                        location: new google.maps
                          .LatLng($scope.array[0].heatmap[point][0],
                                  $scope.array[0].heatmap[point][1]),
                        weight: $scope.array[0].heatmap[point][2]
                      }
                    );
                }
                $scope.real = {lat: $scope.array[0].true_coord[0], lng: $scope.array[i].true_coord[1]};
                $scope.pred = {lat: $scope.array[0].pred_coord[0], lng: $scope.array[i].pred_coord[1]};
              }
          ).then(function(){
            var mapInitURL = URLS.current + 'recon/maps/init';
            var postBody = { sessionToken: $scope.sessionToken() };
            $http.post(mapInitURL, postBody ).then(
                function(groupMaps){
                  $scope.groupMaps = groupMaps.data[0];
                  $scope.mapData = $scope.groupMaps.data;
                  var builtMap = gmapMaker.buildMap($scope.mapData);
                  var builtMap = gmapMaker.buildMap($scope.mapData);
                  $scope.firstFloorMapType = builtMap.mapType;
                  $scope.onClick = builtMap.onClick;
                  $scope.$on('mapInitialized', function(event, map) {
                    $scope.heatmap = map.heatmapLayers.foo;
                    $scope.map = map;
                    $scope.heatmap.set('radius', 40);
                  });
                  $scope.toggleHeatmap= function(event) {
                    $scope.heatmap.setMap($scope.heatmap.getMap() ? null : $scope.map);
                  };
                  $scope.mapReady = true;
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
        $scope.setHeatMap();
      }
      $scope.nextPoint = function(){
        i++;
        if(i >= $scope.array.length){
          i = 0;
        }
        $scope.setHeatMap();
      }
      $scope.setHeatMap = function(){
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
        if(i > 0){
        }
        $scope.real = {lat: $scope.array[i].true_coord[0], lng: $scope.array[i].true_coord[1]};
        $scope.pred = {lat: $scope.array[i].pred_coord[0], lng: $scope.array[i].pred_coord[1]};
        $scope.heatmap.set('data', $scope.heatMapData);
      }
      });
}]);
