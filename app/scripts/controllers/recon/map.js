'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconMapCtrl
 * @description
 * # ReconMapCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconMapCtrl',['$scope', 'URLS', '$http', '$sce', '$routeParams', 'gmapMaker', '$route', '$interval',
    function ($scope, URLS, $http, $sce, $routeParams, gmapMaker, $route, $interval) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      $scope.authorizePage().then(commandChain);

      function commandChain(auth){
        if(!auth){
          return;
        }else{
          getHeatMapData().then(controller);
        }
      }
      
      function controller(){
        //default values
        $scope.isValidMap = true;
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
        console.log($scope.apNameMap);
        //grab map and build!
        var mapURL = URLS.current + 'recon/meta/' + $scope.group_id+ '/maps';
        var postBody = { sessionToken: $scope.sessionToken() };
        $http.post(mapURL, postBody ).then( mapSuccess, mapError);
      };

      function mapSuccess(maps){
        $scope.mapsArray = maps.data;
        $scope.setMap($scope.mapsArray[gmapMaker.getIndex('recon')]);
        $scope.$on('mapInitialized', function(event, map) {
          $scope.map = map;
          $scope.heatmap.setMap($scope.map);
        });
        $scope.toggleHeatmap= function(event) {
            $scope.heatmap.setMap($scope.heatmap.getMap() ? null : $scope.map);
        };
        if(!$scope.exampleHeatmap){
          var heatPoll = $interval(getHeatMapData, 10000);
          //make sure to cancel the interval when the controller is destroyed
          $scope.$on('$destroy', function(){ $interval.cancel(heatPoll);});
        }
      };

      function mapError(error){
        $scope.mapError = true;
      };

      function getHeatMapData(){
        var url = URLS.current + 'recon/coords/get/' + $scope.group_id;
        var stop = Math.floor(Date.now()/1000);
        var start = stop - 10;
        var postBody = { sessionToken: $scope.sessionToken(), startts: start , stopts: stop};
        //var postBody = { sessionToken: $scope.sessionToken(), startts: 1425933453 ,stopts: 1425933500};
        return $http.post(url, postBody ).then( heatDataRecieved, heatDataError);
      };

      function heatDataRecieved(data){
        console.log(data);
        //array indexes
        var ts = 0;
        var lat = 1;
        var lng = 2;
        var mac = 3;
        var isinside = 4;
        var zone = 5;
        var error = 6;
        $scope.heatMapData = [];
        for(var i in data.data){
          $scope.heatMapData.push(new google.maps.LatLng(data.data[i][lat],data.data[i][lng]));
        }
        $scope.setHeatMap();
      };

      $scope.setHeatMap = function(){
        var map = null;
        if($scope.heatmap){
          map = $scope.heatmap.getMap();
          $scope.heatmap.setMap(null);
        }
        $scope.heatmap = new google.maps.visualization.HeatmapLayer({radius: 40, data: $scope.heatMapData});
        $scope.heatmap.setMap(map);
        $scope.exampleHeatmap = false;
      };

      function heatDataError(error){
        console.log(error);
        $scope.heatMapData = gmapMaker.buildHeatmap(16);
        $scope.heatmap = new google.maps.visualization.HeatmapLayer({radius: 40, data: $scope.heatMapData});
        $scope.exampleHeatmap = true;
      };

      $scope.switchMap = function(index){
        gmapMaker.setIndex(index, 'recon');
        $route.reload();
      };

      $scope.setMap = function(map){
        map = map.data;
        console.log(map);
        if(map.invalid){
          $scope.isValidMap = false;
          for(var i in $scope.mapsArray){
            if($scope.mapsArray[i].invalid){
              continue;
            }else{
              map = $scope.mapsArray[i];
              gmapMaker.setIndex(i, 'recon');
              $scope.isValidMap = true;
              break;
            }
          }
          if(!$scope.isValidMap){
            return;
          }
        }
        $scope.mapData = map;
        var builtMap = gmapMaker.buildMap($scope.mapData);
        $scope.firstFloorMapType = builtMap.mapType;
        $scope.onClick = builtMap.onClick;
      };
  }]);
