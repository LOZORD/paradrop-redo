'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconMapCtrl
 * @description
 * # ReconMapCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconMapCtrl',['$scope', 'URLS', '$http', '$sce', '$routeParams', 'gmapMaker', '$route', '$interval', '$filter', 'Recon', 'chartBuilder',
    function ($scope, URLS, $http, $sce, $routeParams, gmapMaker, $route, $interval, $filter, Recon, chartBuilder) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      $scope.searchText ={};
      $scope.chartConfig = chartBuilder.buildZoneChart().chartConfig;
      console.log($scope.chartConfig);
      $scope.timeFilters = [
        {name: 'Rolling', value: null},
        {name: '10 Seconds', value: 10},
        {name: '30 Seconds', value: 30},
        {name: '1 Minute', value: 60},
        {name: '5 Minutes', value: 300}
      ];
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

      var entryTime = Date.now() / 1000; 
      $scope.filterType = $scope.insideFilters[0].name;
      $scope.latest = $scope.timeFilters[0].value;

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
          $scope.heatPoll = $interval(getHeatMapData, 10000);
          //make sure to cancel the interval when the controller is destroyed
          $scope.$on('$destroy', function(){ $interval.cancel($scope.heatPoll);});
        }
      };

      $scope.pausePoly = function(){
        $scope.isPaused = !$scope.isPaused;
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

      var inc = 0;
      function getOpts(){
        inc += 10;
        var opts = { latest: inc};//start: Math.floor(entryTime), stop: Math.floor(Date.now() / 1000)};
        console.log($scope.latest);
        if($scope.latest){
          opts = {latest: $scope.latest};
        }
        return opts; 
      };

      $scope.setChartData = function(){
      };

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

      function heatDataRecieved(data){
        $scope.reconInit.promise.then(
        function(){
          Recon.today.addCoordData(data.data);
          updateChart(Recon.today.getCoordData({latest: 10}));
          //array indexes
          var ts = 1;
          var lat = 2;
          var lng = 3;
          var mac = 4;
          var isinside = 5;
          var zone = 6;
          var error = 7;

          //heatmap stuff
          $scope.heatMapData = [];
          for(var i in data.data){
            var point = data.data[i];
            $scope.heatMapData.push(new google.maps.LatLng(point[lat],point[lng]));
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

      function filterPolylines(newVal, oldVal){
        if(newVal !== oldVal){
          if(!newVal){
            for(var mac in $scope.macData){
              var name = $scope.macData[mac].name;
              $scope.polylines[name].setVisible(!$scope.polylines[name].hidden);
            }
            $scope.showingData = $scope.macData;
            return;
          }
          var dataToHide = $filter('filter')($scope.macData, '!' + newVal, false);
          for(var mac in dataToHide){
            var name = dataToHide[mac].name;
              $scope.polylines[name].setVisible(false);
          }
          $scope.showingData = $filter('filter')($scope.macData, newVal, false);
          for(var mac in $scope.showingData){
            var name = $scope.showingData[mac].name;
            $scope.polylines[name].setVisible(!$scope.polylines[name].hidden);
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

      $scope.createPolygon = (function(){
        var polyID = 0;
        return function(zone){
          console.log(zone);
          if(!$scope.zones){
            $scope.zones = {};
          }
          var colorName = '';
          var color = '';
          var name = '';
          var type = '';
          var temp = $scope.newPoly();
          for(var i in zone.bounds){
            temp.getPath().push(new google.maps.LatLng(zone.bounds[i][0], zone.bounds[i][1]));
          }
          colorName = zone.color;
          color = $scope.colorName[zone.color].code;
          name = zone.name;
          type = zone.type;
          var paths = temp.getPath();
          // Construct the polygon.
          var polygon = new google.maps.Polygon({
            paths: paths,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.15,
            clickable: true,
            type: type,
            colorName: colorName,
            title: name,
            id: polyID,
            infoWindow: new google.maps.InfoWindow()
          });
          google.maps.event.addListener(polygon, 'click', $scope.zoneInfo(polygon));

          $scope.zones[zone.name] = polygon;
          polyID++;
        };
      }());

      $scope.zoneInfo = function(poly){
        return function(event){
          var ll = event.latLng;
          var contentString = '<b>' + poly.title + '</b><br>Type: '+  poly.type + '<br>';
          poly.infoWindow.setContent(contentString);
          poly.infoWindow.setPosition(ll);
          poly.infoWindow.open($scope.map);
        };
      };

      $scope.drawPolylines = function(){
        for(var line in $scope.polylines){
          $scope.polylines[line].setMap(null);
        }
        for(var mac in $scope.macData){
          var name = $scope.macData[mac].name;
          var color = null;
          var hidden = undefined;
          var active = false;
          var visible = true;
          var oldInfoWindow = null;
          if(!$scope.polylines){
            $scope.polylines = {};
          }
          if($scope.polylines[name]){
            //keep active status
            active = $scope.polylines[name].active;
            //keep infoWindow
            oldInfoWindow = $scope.polylines[name].infoWindow;
            //keep color
            color = $scope.polylines[name].strokeColor;
            //keep visibility
            visible = $scope.polylines[name].getVisible();
            hidden = $scope.polylines[name].hidden;
            delete $scope.polylines[name];
          }
          $scope.polylines[name] = $scope.newPoly(color, $scope.macData[mac]);
          $scope.polylines[name].setVisible(visible);
          $scope.polylines[name].hidden = hidden;
          if(oldInfoWindow){
            $scope.polylines[name].infoWindow = oldInfoWindow;
          }
          for(var point in $scope.macData[mac].data){
            var latLng = new google.maps.LatLng($scope.macData[mac].data[point].coords[0], $scope.macData[mac].data[point].coords[1]);
            $scope.polylines[name].getPath().push(latLng);
          }
          if($scope.polyMode){
            $scope.polylines[name].setMap($scope.map);
            if(active){
              $scope.polyDetail($scope.polylines[name]);
            }
          }
        }
      };

      $scope.newPoly = function(color, info){
        if(!color){
          //random color
          color = '#'+ ('000000' + (Math.random()*0xFFFFFF<<0).toString(16)).slice(-6);
        }
        var polyOptions = {
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 3,
          clickable: true,
          draggable: false,
          infoWindow: new google.maps.InfoWindow()
        };
        if(info){
          polyOptions.title = info.name;
          polyOptions.oui = info.oui;
          polyOptions.mac = info.mac;
        }

        var poly = new google.maps.Polyline(polyOptions);
        google.maps.event.addListener(poly, 'click', $scope.polyInfo(poly));
        return poly;
      };

      $scope.polyInfo = function(poly){
        return function(event){
          var ll = event.latLng;
          var contentString = '<b>' + poly.title + '</b><br><b>' + poly.oui + '</b><br><b>' + poly.mac + '</b><br>';
          poly.infoWindow.setContent(contentString);
          poly.infoWindow.setPosition(ll);
          poly.infoWindow.open($scope.map);
        };
      };

      $scope.polyDetail = function(poly){
          var active = poly.active;
          for(var i in $scope.polylines){
            //only one active at a time
            if($scope.polylines[i].active){
              $scope.polylines[i].infoWindow.close();
              $scope.polylines[i].setOptions({strokeWeight: 3});
              $scope.polylines[i].active = false;
            }
          }
          if(!active){
            var ll = poly.getPath().getAt(0);
            var contentString = '<b>' + poly.title + '</b><br><b>' + poly.oui + '</b><br><b>' + poly.mac + '</b><br>';
            poly.setOptions({strokeWeight: 15});
            poly.active = true;
            poly.infoWindow.setContent(contentString);
            poly.infoWindow.setPosition(ll);
            poly.infoWindow.open($scope.map);
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
          for(var poly in $scope.polylines){
            $scope.polylines[poly].setMap(null);
            $scope.polylines[poly].infoWindow.close();
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
        //cancel the interval if we get a db error 
        $interval.cancel($scope.heatPoll);
        $scope.closeAlerts();
        $scope.dangerAlert('<strong>Error:</strong> Problem getting live data from DB automatic pollings has stopped please refresh page to start again.');
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
        console.log(map);
        $scope.mapData = map;
        console.log($scope.mapData);
        var builtMap = gmapMaker.buildMap($scope.mapData);
        $scope.firstFloorMapType = builtMap.mapType;
        $scope.onClick = builtMap.onClick;
        for(var zone in $scope.mapData.zones){
          $scope.createPolygon($scope.mapData.zones[zone]);
        }
      };
  }]);
