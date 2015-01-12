'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('DashboardCtrl', ['ipCookie', 'chartBuilder', '$q', '$scope', '$routeParams', '$sce', 'URLS', '$http', 'Recon','$rootScope', function (ipCookie, chartBuilder, $q, $scope, $routeParams, $sce, URLS, $http, Recon, $rootScope) {
    $scope.initCurrentUser.promise
    .then(function(){ $scope.authorizePage();})
    .then(
      function(){
        $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
        var credentials = { sessionToken: ipCookie('sessionToken'), startts: 1419175301 /*new Date().getTime() / 1000 - 86400*/, stopts: new Date().getTime() / 1000 };
        var groupURL = URLS.current + 'recon/data/get/' + $scope.group_id;
        $http.post(groupURL, credentials).then(
          function(json){
            Recon.parseData(json.data);
            $rootScope.initChart = $q.defer();
            $scope.chartInfo = chartBuilder.buildTotalUsers(); 
            $scope.chartConfig = $scope.chartInfo.chartConfig;
            $rootScope.initChart.promise.then(
              function(){
                $scope.contentLoaded = true;
                setTimeout(function(){
                  $scope.chartInfo.chart.reflow();
                  $scope.redraw = function(){
                    setTimeout(function(){
                      $scope.chartInfo.chart.reflow();
                    },0);
                  };
                },0);
              }
            );
            $rootScope.initChart2 = $q.defer();
            $scope.chartInfo2 = chartBuilder.buildEngagementChart(); 
            $scope.chartConfig2 = $scope.chartInfo2.chartConfig;
            $rootScope.initChart2.promise.then(
              function(){
                $scope.content2Loaded = true;
                setTimeout(function(){
                  $scope.chartInfo2.chart.reflow();
                  $scope.redraw2 = function(){
                    setTimeout(function(){
                      $scope.chartInfo2.chart.reflow();
                    },0);
                  };
                },0);
              }
            );
            $rootScope.initChart3 = $q.defer();
            var body = { sessionToken: ipCookie('sessionToken') };
            var metaURL = URLS.current + 'recon/meta/' + $scope.group_id + '/distinctmac';
            var chart = $http.post(metaURL, body).then(
              function(seenMacs){
                $scope.chartInfo3 = chartBuilder.buildRepeatVisitsChart(seenMacs.data); 
                $scope.chartConfig3 = $scope.chartInfo3.chartConfig;
                $scope.totalCusts = $scope.chartInfo3.totalCusts;
                $rootScope.initChart3.promise.then(
                  function(){
                    $scope.content3Loaded = true;
                    setTimeout(function(){
                      $scope.chartInfo3.chart.reflow();
                      $scope.redraw3 = function(){
                        setTimeout(function(){
                          $scope.chartInfo3.chart.reflow();
                        },0);
                      };
                    },0);
                  }
                );
              }
            );
          });
      });
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
    $scope.positions = [];
    $scope.onClick = function(event) {
        console.log($scope.map.markers);
        var ll = event.latLng;
        console.log('Lat: ' + ll.lat(), ' Lng: ' + ll.lng());
        $scope.positions.push({lat: ll.lat(), lng: ll.lng()});
        //$scope.map.markers[$scope.markers.length].setMap($scope.map);
    }
    //The PNG image itself is 2104 x 1641
    //center of bookstore: center="[43.074675, -89.397898]" 

    //Create the Options required to change the MapType
    var firstFloorTypeOptions = {
          getTileUrl: function(coord, zoom) {
              var normalizedCoord = getNormalizedCoord(coord, zoom);
              if (!normalizedCoord) {
                return null;
              }
              if(gotMap === false) {
                //console.log('Returning one map');
                gotMap = true;
                return 'http://paradrop.wings.cs.wisc.edu/storage/statestreet-firstfloor-outline.png';
              } else {
                return null;
              }
          },
          tileSize: new google.maps.Size(900, 700),
          maxZoom: 5,
          minZoom: 5,
          radius: 17380,
          name: 'First Floor'
    };

    $scope.firstFloorMapType = new google.maps.ImageMapType(firstFloorTypeOptions);
        
  }]);
