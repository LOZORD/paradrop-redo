'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('DashboardCtrl', [ 'chartBuilder', '$q', '$scope', '$routeParams', '$sce', 'URLS', '$http', 'Recon','$rootScope', function (chartBuilder, $q, $scope, $routeParams, $sce, URLS, $http, Recon, $rootScope) {
    $scope.initCurrentUser.promise
    .then(function(){ $scope.authorizePage();})
    .then(
      function(){
        $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
        var credentials = { sessionToken: $scope.currentUser.id, startts: 1419175301 /*new Date().getTime() / 1000 - 86400*/, stopts: new Date().getTime() / 1000 };
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
            var body = { sessionToken: $scope.currentUser.id };
            var metaURL = URLS.current + 'recon/meta/' + $scope.group_id + '/distinctmac';
            var chart = $http.post(metaURL, body).then(
              function(seenMacs){
                $scope.chartInfo3 = chartBuilder.buildRepeatVisitsChart(seenMacs.data); 
                $scope.chartConfig3 = $scope.chartInfo3.chartConfig;
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
  }]);
