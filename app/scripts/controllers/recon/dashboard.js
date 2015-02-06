'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconDashboardCtrl
 * @description
 * # ReconDashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconDashboardCtrl',['$rootScope', '$scope', '$sce', '$routeParams', 'chartBuilder',
    function ($rootScope, $scope, $sce, $routeParams, chartBuilder) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      $scope.authorizePage()
      .then(function(authorized){
        if(authorized){
          $rootScope.chartsBuilt.promise.then(function(){
            var charts = chartBuilder.getBuiltCharts();
            //chart 1
            $scope.chartInfo = charts.totalUsers; 
            $scope.chartConfig = $scope.chartInfo.chartConfig;
            $scope.contentLoaded = true;
            //chart 2
            $scope.chartInfo2 = charts.engagement; 
            $scope.chartConfig2 = $scope.chartInfo2.chartConfig;
            $scope.content2Loaded = true;
            //chart 3
            /*
            $scope.chartInfo3 = charts.repeatVisits; 
            $scope.chartConfig3 = $scope.chartInfo3.chartConfig;
            $scope.totalCusts = $scope.chartInfo3.totalCusts;
            $scope.content3Loaded = true;
            */
          });
        }
      });
  }]);
