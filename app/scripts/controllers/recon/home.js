'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconHomeCtrl
 * @description
 * # ReconHomeCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconHomeCtrl',['$scope', '$sce', '$routeParams', 'Recon', 'chartBuilder', 'ipCookie', '$http', 'URLS', '$q', '$rootScope', function ($scope, $sce, $routeParams, Recon, chartBuilder, ipCookie, $http, URLS, $q, $rootScope) {
  $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
  $scope.initCurrentUser.promise
  .then(function(){ $scope.authorizePage();})
  .then(
    function(){
      var charts = chartBuilder.getBuiltCharts();
      if(charts){
        //skip building charts
        //$scope.totalCusts = charts.repeatVisits.totalCusts;
        $scope.totalCusts = Recon.recon.getNumberCustomersInside();
        $scope.contentLoaded = true;
      }else{ 
          //build charts ahead of time
          $rootScope.reconInit.promise.then(function(){
          console.log('promise resolved');
          var body = { sessionToken: ipCookie('sessionToken'), upto: Date.now() /1000 - 86400 };
          var metaURL = URLS.current + 'recon/meta/' + $scope.group_id + '/distinctmac';
          /*var chart = $http.post(metaURL, body).then(
            function(seenMacs){
              var repeatChart = chartBuilder.buildRepeatVisitsChart(seenMacs.data); 
              $scope.totalCusts = repeatChart.totalCusts;
              $scope.contentLoaded = true;
            }
          );*/

          //then build the  second two ahead of time
          $scope.totalCusts = Recon.recon.getNumberCustomersInside();
          $scope.contentLoaded = true;
          chartBuilder.buildTotalUsers(); 
          console.log('Total Users Chart Built');
          chartBuilder.buildEngagementChart(); 
          console.log('Engagement Chart Built');
        });
      }
    }
    );
}]);
