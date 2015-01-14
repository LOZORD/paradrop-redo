'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconDashboardCtrl
 * @description
 * # ReconDashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconDashboardCtrl',['$scope', '$sce', '$routeParams', '$http', 'Recon', 'chartBuilder', 'ipCookie', 'URLS', function ($scope, $sce, $routeParams, $http, Recon, chartBuilder, ipCookie, URLS) {
    $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
    $scope.initCurrentUser.promise
    .then(function(){ $scope.authorizePage();})
    .then(
      function(){
        var charts = chartBuilder.getBuiltCharts();
        if(charts){
          //chart 1
          $scope.chartInfo = charts.totalUsers; 
          $scope.chartConfig = $scope.chartInfo.chartConfig;
          $scope.contentLoaded = true;
          //chart 2
          $scope.chartInfo2 = charts.engagement; 
          $scope.chartConfig2 = $scope.chartInfo2.chartConfig;
          $scope.content2Loaded = true;
          //chart 3
          $scope.chartInfo3 = charts.repeatVisits; 
          $scope.chartConfig3 = $scope.chartInfo3.chartConfig;
          $scope.totalCusts = $scope.chartInfo3.totalCusts;
          $scope.content3Loaded = true;
        }else{
          //have to build charts
          var credentials = { sessionToken: ipCookie('sessionToken'), startts: Date.now() / 1000 - 86400, stopts: Date.now() / 1000 };
          var groupURL = URLS.current + 'recon/data/get/' + $scope.group_id;
          $http.post(groupURL, credentials).then(
            function(json){
              Recon.parseData(json.data);
              $scope.chartInfo = chartBuilder.buildTotalUsers(); 
              $scope.chartConfig = $scope.chartInfo.chartConfig;
              $scope.contentLoaded = true;

              $scope.chartInfo2 = chartBuilder.buildEngagementChart(); 
              $scope.chartConfig2 = $scope.chartInfo2.chartConfig;
              $scope.content2Loaded = true;

              var body = { sessionToken: ipCookie('sessionToken'), upto: Date.now() /1000 - 86400 };
              var metaURL = URLS.current + 'recon/meta/' + $scope.group_id + '/distinctmac';
              var chart = $http.post(metaURL, body).then(
                function(seenMacs){
                  $scope.chartInfo3 = chartBuilder.buildRepeatVisitsChart(seenMacs.data); 
                  $scope.chartConfig3 = $scope.chartInfo3.chartConfig;
                  $scope.totalCusts = $scope.chartInfo3.totalCusts;
                  $scope.content3Loaded = true;
                }
              );
            }
          );
        }
      });
  }]);
