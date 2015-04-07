'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconMapCtrl
 * @description
 * # ReconMapCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconMapCtrl',['$scope', 'URLS', '$http', '$sce', '$routeParams', 'gmapMaker', '$route', '$interval', '$filter',
    function ($scope, URLS, $http, $sce, $routeParams, gmapMaker, $route, $interval, $filter) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      var id = 1;
      $scope.authorizePage().then(commandChain);
      

      function commandChain(auth){
        if(!auth){
          return;
        }else{
          controller();
        }
      }
      
      function controller(){
        //default values
        $scope.isValidMap = true;
        $scope.showMarkers = true;
        $scope.markerBtnText = 'Hide';
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
          getHeatMapData();
        });
        if($scope.isValidMap){
          var heatPoll = $interval(getHeatMapData, 10000);
          //make sure to cancel the interval when the controller is destroyed
          $scope.$on('$destroy', function(){ $interval.cancel(heatPoll);});
        }
      };

      function mapError(error){
        $scope.mapError = true;
        $scope.closeAlerts();
        $scope.dangerAlert('<strong>Error:</strong> There was an error retrieving the map information. Please refresh the page to try again.');
      };

      function getHeatMapData(){
        var url = URLS.current + 'recon/coords/get/' + $scope.group_id;
        var stop = Math.floor(Date.now()/1000);
        var start = stop - 10;
        var postBody = { sessionToken: $scope.sessionToken(), startts: null , stopts: null, typeid: $scope.mapData.typeid };
        return $http.post(url, postBody ).then( heatDataRecieved, heatDataError);
      };

      function heatDataRecieved(data){
        console.log(data);
        //array indexes
        var ts = 1;
        var lat = 2;
        var lng = 3;
        var mac = 4;
        var isinside = 5;
        var zone = 6;
        var error = 7;
        $scope.heatMapData = [];
        if(!$scope.macData){
          $scope.macData = {};
        }
        for(var i in data.data){
          var point = data.data[i];
          $scope.heatMapData.push(new google.maps.LatLng(point[lat],point[lng]));
          //data for polylines
          if(!$scope.macData[point[mac]]){
            $scope.macData[point[mac]] = {id: 'device-' + id};
            id++;
          }
          if($scope.macData[point[mac]][point[ts]]){
            continue;
          }
          $scope.macData[point[mac]][point[ts]] = {};
          if(!$scope.macData[point[mac]].data){
            $scope.macData[point[mac]].data = [];
          }
          $scope.macData[point[mac]].data.push(
            {
              ts: point[ts],
              latLng: new google.maps.LatLng(point[lat], point[lng]),
              zone: point[zone],
              mac: point[mac],
              isinside: point[isinside],
              error: point[error]
            }
          );
        }
        //sort data by ts and put in array
        if($scope.dataArr){
          delete $scope.dataArr;
        }
        $scope.dataArr = [];
        for(var mac in $scope.macData){
          $scope.macData[mac].data = $filter('orderBy')($scope.macData[mac].data, 'ts');
          $scope.dataArr.push($scope.macData[mac]);
        }
        console.log($scope.dataArr);
        $scope.drawPolylines($scope.dataArr);
        filterPolylines($scope.searchText, null);
        $scope.setHeatMap();
      };

      $scope.$watch(function(){return $scope.searchText;}, filterPolylines);

      function filterPolylines(newVal, oldVal){
        if(newVal !== oldVal){
          if(!newVal){
            for(var mac in $scope.macData){
              $scope.macData[mac].poly.setVisible(!$scope.macData[mac].poly.hidden);
            }
            $scope.showingData = $scope.dataArr;
            return;
          }
          var dataToHide = $filter('filter')($scope.dataArr, '!'+newVal, false);
          for(var mac in dataToHide){
            dataToHide[mac].poly.setVisible(false);
          }
          $scope.showingData = $filter('filter')($scope.dataArr, newVal, false);
          for(var mac in $scope.showingData){
            $scope.showingData[mac].poly.setVisible(!$scope.showingData[mac].poly.hidden);
          }
        }
      }

      $scope.drawPolylines = function(macData){
        for(var mac in $scope.macData){
          var color = null;
          var hidden = undefined;
          var visible = true;
          if($scope.macData[mac].poly){
            //keep color
            color = $scope.macData[mac].poly.strokeColor;
            //keep visibility
            visible = $scope.macData[mac].poly.getVisible();
            hidden = $scope.macData[mac].poly.hidden;
            $scope.macData[mac].poly.setMap(null);
            delete $scope.macData[mac].poly;
          }
          $scope.macData[mac].poly = $scope.newPoly(color, $scope.macData[mac].id);
          $scope.macData[mac].poly.setVisible(visible);
          $scope.macData[mac].poly.hidden = hidden;
          for(var point in $scope.macData[mac].data){
            $scope.macData[mac].poly.getPath().push($scope.macData[mac].data[point].latLng);
          }
          $scope.macData[mac].poly.setMap($scope.map);
        }
      };

      $scope.newPoly = function(color, title){
        if(!color){
          //random color
          color = '#'+ ('000000' + (Math.random()*0xFFFFFF<<0).toString(16)).slice(-6);
          console.log(color);
        }
        var polyOptions = {
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 6,
          clickable: true,
          draggable: true,
          title: title,
          infoWindow: new google.maps.InfoWindow()
        };

        var poly = new google.maps.Polyline(polyOptions);
        google.maps.event.addListener(poly, 'click', $scope.polyInfo(poly));
        return poly;
      };

      $scope.polyInfo = function(poly){
        return function(event){
          var ll = event.latLng;
          var contentString = '<b>' + poly.title + '</b><br>';
          poly.infoWindow.setContent(contentString);
          poly.infoWindow.setPosition(ll);
          poly.infoWindow.open($scope.map);
          console.log('clicked poly' + poly);
        };
      };

      $scope.setHeatMap = function(){
        if($scope.heatmap){
          $scope.heatmap.setMap(null);
        }
        $scope.heatmap = new google.maps.visualization.HeatmapLayer({radius: 40, data: $scope.heatMapData});
        $scope.heatmap.setMap($scope.map);
        console.log($scope.heatmap);
      };

      function heatDataError(error){
        console.log(error);
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
            if($scope.mapsArray[i].data.invalid){
              continue;
            }else{
              map = $scope.mapsArray[i].data;
              gmapMaker.setIndex(i, 'recon');
              $scope.isValidMap = true;
              break;
            }
          }
          if(!$scope.isValidMap){
            $scope.closeAlerts();
            $scope.dangerAlert('<strong>Error:</strong> This user has no valid maps to display. Please contact <a class="alert-link" href="mailto:admin@paradrop.io">admin@paradrop.io</a> if you think this is an error.');
            return;
          }
        }
        $scope.mapData = map;
        var builtMap = gmapMaker.buildMap($scope.mapData);
        $scope.firstFloorMapType = builtMap.mapType;
        $scope.onClick = builtMap.onClick;
      };
  }]);
