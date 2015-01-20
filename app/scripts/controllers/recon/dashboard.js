'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconDashboardCtrl
 * @description
 * # ReconDashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconDashboardCtrl',['$rootScope', '$scope', '$sce', '$routeParams', '$http', 'Recon', 'chartBuilder', 'ipCookie', 'URLS', function ($rootScope, $scope, $sce, $routeParams, $http, Recon, chartBuilder, ipCookie, URLS) {
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
          $rootScope.reconInit.promise.then(
            function(){
              $scope.chartInfo = chartBuilder.buildTotalUsers(); 
              $scope.chartConfig = $scope.chartInfo.chartConfig;
              $scope.contentLoaded = true;

              $scope.chartInfo2 = chartBuilder.buildEngagementChart(); 
              $scope.chartConfig2 = $scope.chartInfo2.chartConfig;
              $scope.content2Loaded = true;

              Recon.recon.setupRepeatVisits().then(
                function(){
                  $scope.chartInfo3 = chartBuilder.buildRepeatVisitsChart(); 
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
