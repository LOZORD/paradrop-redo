'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconTrackingCtrl
 * @description
 * # ReconTrackingCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconTrackingCtrl',['$scope', 'URLS', '$http', '$sce', '$routeParams', 'gmapMaker', '$route', '$filter', 'Recon', 'chartBuilder', '$localStorage', '$interval',
    function ($scope, URLS, $http, $sce, $routeParams, gmapMaker, $route, $filter, Recon, chartBuilder, $localStorage, $interval) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      $scope.searchText ={};
      $scope.noneActive = true;
      $scope.chartConfig = chartBuilder.buildZoneChart().chartConfig;
      $scope.insideFilters = [
        {name: 'Disabled'},
        {name: 'Inside'},
        {name: 'Outside'},
      ];
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

      $scope.filterType = $scope.insideFilters[0].name;
      $scope.authorizePage().then(commandChain);
      

      function commandChain(auth){
        if(!auth){
          return;
        }else{
          controller();
        }
      }

      $scope.setStartTs = function(){
        $scope.startts = Math.round($scope.datepicker.start.getTime()/1000)
      };

      $scope.setStopTs = function(){
        $scope.stopts = Math.round($scope.datepicker.stop.getTime()/1000)
      };
      
      function controller(){
        //get last stored vals for mac and time search
        $scope.startts = $localStorage.start;
        $scope.stopts = $localStorage.stop;
        $scope.mac = $localStorage.trackingMac;

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
          //if we're in live tracking fire that chain
          if($route.current.templateUrl === 'views/recon/map.html'){
            $scope.getLiveHeatMapData();
            if($scope.isValidMap){
              $scope.heatPoll = $interval($scope.getLiveHeatMapData, 30000);
              //make sure to cancel the interval when the controller is destroyed
              $scope.$on('$destroy', function(){ $interval.cancel($scope.heatPoll);});
            }
          }

        });
      };

      function mapError(error){
        $scope.mapError = true;
        $scope.closeAlerts();
        $scope.dangerAlert('<strong>Error:</strong> There was an error retrieving the map information. Please refresh the page to try again.');
      };

      //flow for live tracking
      var inc = 0;
      function getOpts(){
        inc += 30;
        var opts = { latest: inc, aggregate: 30};
        if($scope.latest){
          opts = {latest: $scope.latest, aggregate: 30};
        }
        return opts; 
      };

      $scope.pausePoly = function(){
        $scope.isPaused = !$scope.isPaused;
      };

      $scope.getLiveHeatMapData = function(){
        var url = URLS.current + 'recon/coords/get/' + $scope.group_id;
        var stop = Math.floor(Date.now()/1000);
        var start = stop - 10;
        var postBody = { sessionToken: $scope.sessionToken(), startts: Math.floor((Date.now() /1000) - 30) , stopts: Math.floor(Date.now() /1000), typeid: $scope.mapData.typeid };
        return $http.post(url, postBody ).then( liveHeatDataRecieved, heatDataError);
      };

      function liveHeatDataRecieved(data){
        $scope.reconInit.promise.then(
        function(){
          Recon.today.addCoordData(data.data);
          updateChart(Recon.today.getCoordData({latest: 30}));
          //array indexes
          var ts = 1;
          var lat = 2;
          var lng = 3;
          var mac = 4;
          var isinside = 5;
          var zone = 6;
          var error = 7;

          $scope.parsedData = Recon.today.parseCoordData(data.data, {aggregate: 30});
          if(!$scope.parsedData){
            $scope.parsedData = [];
          }
          //heatmap stuff
          $scope.heatMapData = [];
          for(var i in $scope.parsedData){
            for(var k in $scope.parsedData[i].data){
              var point = $scope.parsedData[i].data[k].coords;
              $scope.heatMapData.push(new google.maps.LatLng(point[0],point[1]));
            }
          }
          $scope.setHeatMap();

          //polymode stuff
          var opts = getOpts();
          if($scope.polyMode && !$scope.isPaused){
            $scope.macData = Recon.today.getCoordData(opts);
            //Recon.today.printCoordData(coordData);
            if(!$scope.macData){
              $scope.macData = [];
            }
            $scope.drawPolylines();
            filterPolylines($scope.searchText, null);
          }
        });
      };

      //flow for historical tracking
      $scope.getHeatMapData = function(){
        var url = URLS.current + 'recon/coords/get/' + $scope.group_id;
        var stop = Math.round($scope.stopts);
        var start = Math.round($scope.startts);
        if(!start || !stop){
          stop = null;
          start = null;
        }
        var mac = $scope.mac;
        if(typeof mac === undefined || !mac){
          mac = null;
        }
        $localStorage.trackingMac = mac;
        $localStorage.start = start;
        $localStorage.stop = stop;
        var postBody = { sessionToken: $scope.sessionToken(), startts: start, stopts: stop, filtermac: mac, typeid: $scope.mapData.typeid };
        console.log(postBody);
        return $http.post(url, postBody ).then( heatDataRecieved, heatDataError);
      };

      function heatDataRecieved(data){
        $scope.reconInit.promise.then(
        function(){
          updateChart(Recon.today.parseCoordData(data.data));
          //array indexes
          var ts = 1;
          var lat = 2;
          var lng = 3;
          var mac = 4;
          var isinside = 5;
          var zone = 6;
          var error = 7;
          $scope.macData = Recon.today.parseCoordData(data.data, {aggregate: 30});
            if(!$scope.macData){
              $scope.macData = [];
            }

            console.log($scope.macData);
          //heatmap stuff
          $scope.heatMapData = [];
          for(var i in $scope.macData){
            for(var k in $scope.macData[i].data){
              var point = $scope.macData[i].data[k].coords;
              $scope.heatMapData.push(new google.maps.LatLng(point[0],point[1]));
            }
          }
          $scope.setHeatMap();

          //polymode stuff
          if($scope.polyMode){
            //Recon.today.printCoordData(coordData);
            $scope.drawPolylines();
            filterPolylines($scope.searchText, null);
          }
        });
      };

      //Shared functions
      function updateChart(data){
        var series = {};
        for(var mac in data){
          if(data[mac].zoneNow){
            if(!series[data[mac].zoneNow]){
              series[data[mac].zoneNow] = 1;
            }else{
              series[data[mac].zoneNow]++;
            }
          }
        }
        $scope.chartConfig.loading = false;
        $scope.chartConfig.series.pop();
        $scope.chartConfig.series.push({
          data: [],
          name: 'Number of Devices',
          color: '#7cb5ec'
        });
        $scope.chartConfig.xAxis.categories = [];
        for(var zone in $scope.mapData.zones){
          if($scope.mapData.zones[zone].type != "Impossible"){
            if(series[zone]){
              $scope.chartConfig.series[0].data.push({name: zone, y: series[zone]});
              $scope.chartConfig.xAxis.categories.push(zone);
            }else{
              $scope.chartConfig.series[0].data.push({name: zone, y: 0});
              $scope.chartConfig.xAxis.categories.push(zone);
            }
          }
        }
      }

      //watch for filtering in polymode
      $scope.$watch(function(){return $scope.searchText;}, filterPolylines, true);

      function filterPolylines(newVal, oldVal){
        if(newVal !== oldVal){
          if(!newVal){
            for(var mac in $scope.macData){
              var name = $scope.macData[mac].name;
              $scope.polylines[name].setVisible(!$scope.polylines[name].hidden);
              for(var i in $scope.polylines[name].points){
                $scope.polylines[name].points[i].setVisible(!$scope.polylines[name].hidden);
              }
            }
            $scope.showingData = $scope.macData;
            return;
          }
          var dataToHide = $filter('filter')($scope.macData, '!' + newVal, false);
          for(var mac in dataToHide){
            var name = dataToHide[mac].name;
              $scope.polylines[name].setVisible(false);
              for(var i in $scope.polylines[name].points){
                $scope.polylines[name].points[i].setVisible(false);
              }
          }
          $scope.showingData = $filter('filter')($scope.macData, newVal, false);
          for(var mac in $scope.showingData){
            var name = $scope.showingData[mac].name;
            $scope.polylines[name].setVisible(!$scope.polylines[name].hidden);
            for(var i in $scope.polylines[name].points){
              $scope.polylines[name].points[i].setVisible(!$scope.polylines[name].hidden);
            }
          }
          for(var zone in $scope.mapData.zones){
            if(newVal[zone]){
              $scope.zones[zone].setMap($scope.map);
            }else{
              $scope.zones[zone].setMap(null);
            }
          }
        }
      }

      $scope.inFilter = function(){
        console.log($scope.filterType);
        if($scope.filterType === 'Disabled'){
          delete $scope.searchText.insideNow;
        }else if($scope.filterType === 'Inside'){
          $scope.searchText.insideNow = true;
        }else{
          $scope.searchText.insideNow = false;
        }
      };

      $scope.createZones = function(zone){
        if(!$scope.zones){
          $scope.zones = {};
        }
        var newZone = gmapMaker.buildZone(zone, $scope.zoneInfo);
        $scope.zones[newZone.title] = newZone;
      };

      $scope.zoneInfo = function(zone){
        return function(event){
          var ll = event.latLng;
          var contentString = '<b>' + zone.title + '</b><br>Type: '+  zone.type + '<br>';
          zone.infoWindow.setContent(contentString);
          zone.infoWindow.setPosition(ll);
          zone.infoWindow.open($scope.map);
        };
      };

      $scope.drawPolylines = function(){
        for(var line in $scope.polylines){
          $scope.polylines[line].setMap(null);
          for(var i in $scope.polylines[line].points){
            $scope.polylines[line].points[i].setMap(null);
          }
        }
        for(var mac in $scope.macData){
          mac = $scope.macData[mac];
          var name = mac.name;
          var color = null;
          var hidden = undefined;
          var active = false;
          var visible = true;
          if(!$scope.polylines){
            $scope.polylines = {};
          }
          if($scope.polylines[name]){
            //keep active status
            active = $scope.polylines[name].active;
            //keep color
            color = $scope.polylines[name].strokeColor;
            //keep visibility
            visible = $scope.polylines[name].getVisible();
            hidden = $scope.polylines[name].hidden;
            delete $scope.polylines[name];
          }
          var extras = { name: mac.name, oui: mac.oui, mac: mac.mac };
          $scope.polylines[name] = gmapMaker.newPoly(color, extras);
          google.maps.event.addListener($scope.polylines[name], 'click', $scope.polyInfo($scope.polylines[name], false));
          $scope.polylines[name].setVisible(visible);
          $scope.polylines[name].hidden = hidden;
          for(var point in mac.data){
            var latLng = new google.maps.LatLng(mac.data[point].coords[0], mac.data[point].coords[1]);
            $scope.polylines[name].getPath().push(latLng);
            if(!$scope.polylines[name].pointData){
              $scope.polylines[name].pointData = [];
            }
            $scope.polylines[name].pointData.push({latLng: latLng, ts: mac.data[point].ts, aggPts: mac.data[point].aggPts});
          }
          if($scope.polyMode){
            $scope.polylines[name].setMap($scope.map);
            var pointArr = $scope.polylines[name].pointData;
            for (var point in pointArr) {
              var borderColor = $scope.polylines[name].strokeColor;
              if(point == 0 || point == (pointArr.length -1)){
                borderColor = '#fff';
              }
              var pointOptions = {
                strokeColor: borderColor,
                strokeOpacity: 1,
                strokeWeight: 3,
                fillColor: $scope.polylines[name].strokeColor,
                fillOpacity: 1,
                map: $scope.map,
                center: pointArr[point].latLng,
                zIndex: 100,
                ts: pointArr[point].ts,
                aggPts: pointArr[point].aggPts,
                loc: pointArr[point].latLng,
                oui: $scope.polylines[name].oui,
                mac: $scope.polylines[name].mac,
                radius: 30000
              };
              if(!$scope.pointInfo){
                $scope.pointInfo = new google.maps.InfoWindow();
              }
              // Add the circle for this point to the map and store in polyline.
              if(!$scope.polylines[name].points){
                $scope.polylines[name].points = [];
              }
              var newPoint = new google.maps.Circle(pointOptions);
              $scope.polylines[name].points.push(newPoint);
              google.maps.event.addListener(newPoint, 'click', $scope.polyInfo($scope.polylines[name], newPoint));
            }
            if(active){
              $scope.polyDetail($scope.polylines[name]);
            }
          }
        }
      };

      $scope.setDetail = function(points, index){
        $scope.detail = points;
        $scope.detailIndex = index;
      };
    
      $scope.nextPoint = function(){
        if($scope.detailIndex < $scope.detail.length -1){
          $scope.detailIndex++;
          var point = $scope.detail[$scope.detailIndex];
          //point.setZIndex(150);
          //$scope.detail[$scope.detailIndex -1].setZIndex(100);
          $scope.showPointInfo($scope.detail[$scope.detailIndex])();
        }
      };

      $scope.prevPoint = function(){
        if($scope.detailIndex > 0){
          $scope.detailIndex--;
          var point = $scope.detail[$scope.detailIndex];
          //point.setZIndex(150);
          //$scope.detail[$scope.detailIndex+1].setZIndex(100);
          $scope.showPointInfo($scope.detail[$scope.detailIndex])();
        }
      };

      $scope.showPointInfo = function(point){
        return function(){
          var content = '<b>Mac: </b>' + point.mac + '<br>';
          content += '<b>OUI: </b>' + point.oui + '<br>';
          content += '<b>Points Used: </b>' + point.aggPts + '<br>';
          content += '<b>Time: </b>' + (new Date(point.ts * 1000)).toLocaleTimeString() + '<br>';
          content += '<b>ts: </b>' + point.ts + '<br>';
          $scope.pointInfo.setContent(content);
          $scope.pointInfo.setPosition(point.loc);
          $scope.pointInfo.open($scope.map);
        }
      };

      $scope.polyInfo = function(poly, point){
        return function(){ $scope.polyDetail(poly, point);};
      };

      $scope.polyDetail = function(poly, point){
          var active = poly.active;
          for(var i in $scope.polylines){
            //only one active at a time
            if($scope.polylines[i].active){
              $scope.polylines[i].setOptions({strokeWeight: 3});
              for(var k in $scope.polylines[i].points){
                $scope.polylines[i].points[k].setRadius(30000);
              }
              $scope.polylines[i].active = false;
            }
            $scope.noneActive = true;
            $scope.$apply();
          }
          $scope.pointInfo.close();
          if(!active){
            if(point){
              $scope.showPointInfo(point)();
              for(var i in poly.points){
                if(poly.points[i] === point){
                  $scope.setDetail(poly.points, i);
                  break;
                }
              }
            }else{
              $scope.showPointInfo(poly.points[0])();
              $scope.setDetail(poly.points, 0);
            }
            poly.setOptions({strokeWeight: 15});
            for(var point in poly.points){
              poly.points[point].setRadius(60000);
            }
            poly.active = true;
            $scope.noneActive = false;
            $scope.$apply();
          }
      };

      $scope.zoneFilter = function(){
        for(var key in $scope.mapData.zones){
          if($scope.searchText[key] === false){
            delete $scope.searchText[key];
          }
        }
      };

      $scope.setHeatMap = function(){
        if($scope.heatmap){
          $scope.heatmap.setMap(null);
        }
        $scope.heatmap = new google.maps.visualization.HeatmapLayer({radius: 40, data: $scope.heatMapData});
        if(!$scope.polyMode){
        $scope.heatmap.setMap($scope.map);
        }
      };
      
      $scope.togglePolyMode = function(){
        $scope.polyMode = !$scope.polyMode;
        if(!$scope.polyMode){
          $scope.pointInfo.close();
          for(var poly in $scope.polylines){
            $scope.polylines[poly].setMap(null);
            for(var i in $scope.polylines[poly].points){
              $scope.polylines[poly].points[i].setMap(null);
            }
            if($scope.polylines[poly].active){
              $scope.polyDetail($scope.polylines[poly]);
            }
          }
          if($scope.heatmap){
            $scope.heatmap.setMap($scope.map);
          }        
          for(var zone in $scope.zones){
            $scope.zones[zone].setVisible(false);
          }
        }else{
          for(var poly in $scope.polylines){
            $scope.polylines[poly].setMap($scope.map);
            for(var i in $scope.polylines[poly].points){
              $scope.polylines[poly].points[i].setMap($scope.map);
            }
          }
          if($scope.heatmap){
            $scope.heatmap.setMap(null);
          }        
          for(var zone in $scope.zones){
            $scope.zones[zone].setVisible(true);
          }
        }
      };

      function heatDataError(error){
        console.log(error);
        if($scope.heatPoll){
          $interval.cancel($scope.heatPoll);
          $scope.closeAlerts();
          $scope.dangerAlert('<strong>Error:</strong> Problem getting live data from DB automatic pollings has stopped please refresh page to start again.');
        }
      };

      $scope.switchMap = function(index){
        gmapMaker.setIndex(index, 'recon');
        $route.reload();
      };

      $scope.setMap = function(map){
        map = map.data;
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
        for(var zone in $scope.mapData.zones){
          $scope.createZones($scope.mapData.zones[zone]);
        }
      };
  }]);
