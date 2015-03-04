'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconMapCtrl
 * @description
 * # ReconMapCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconMapCtrl',['$scope', 'URLS', '$http', '$sce', '$routeParams', 'gmapMaker', '$route',
    function ($scope, URLS, $http, $sce, $routeParams, gmapMaker, $route) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
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
          var mapURL = URLS.current + 'recon/meta/' + $scope.group_id+ '/maps';
          var postBody = { sessionToken: $scope.sessionToken() };
          $http.post(mapURL, postBody ).then(
              function(maps){
                $scope.mapsArray = maps.data;
                $scope.setMap($scope.mapsArray[gmapMaker.getIndex('recon')]);
                $scope.$on('mapInitialized', function(event, map) {
                  $scope.heatmap = map.heatmapLayers.foo;
                  $scope.map = map;
                  $scope.heatmap.set('radius', 30);
                });
                $scope.toggleHeatmap= function(event) {
                  $scope.heatmap.setMap($scope.heatmap.getMap() ? null : $scope.map);
                };
              }
          , function(error){$scope.mapError = true;});
        } 
      });

      $scope.switchMap = function(index){
        console.log(index);
        gmapMaker.setIndex(index, 'recon');
        $route.reload();
      };

      $scope.setMap = function(map){
        console.log(map);
        $scope.mapData = map;
        var builtMap = gmapMaker.buildMap($scope.mapData);
        $scope.firstFloorMapType = builtMap.mapType;
        $scope.onClick = builtMap.onClick;
        $scope.heatMapData = gmapMaker.buildHeatmap();
      };
  }]);
