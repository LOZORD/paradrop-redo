'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconHomeCtrl
 * @description
 * # ReconHomeCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconHomeCtrl',['$scope', '$sce', '$routeParams', 'Recon', 'chartBuilder', 'ipCookie', '$http', 'URLS', function ($scope, $sce, $routeParams, Recon, chartBuilder, ipCookie, $http, URLS) {
  $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
  $scope.initCurrentUser.promise
  .then(function(){ $scope.authorizePage();})
  .then(
    function(){
      var charts = chartBuilder.getBuiltCharts();
      if(charts){
        //skip building charts
        $scope.totalCusts = charts.repeatVisits.totalCusts;
        $scope.contentLoaded = true;
      }else{ 
        //build charts ahead of time
        var credentials = { sessionToken: ipCookie('sessionToken'), startts: Date.now() / 1000 - 86400, stopts: Date.now() / 1000 };
        var groupURL = URLS.current + 'recon/data/get/' + $scope.group_id;
        $http.post(groupURL, credentials).then(
          function(json){
            Recon.parseData(json.data);
            //build repeat first since it's needed
            var body = { sessionToken: ipCookie('sessionToken'), upto: Date.now() /1000 - 86400 };
            var metaURL = URLS.current + 'recon/meta/' + $scope.group_id + '/distinctmac';
            var chart = $http.post(metaURL, body).then(
              function(seenMacs){
                var repeatChart = chartBuilder.buildRepeatVisitsChart(seenMacs.data); 
                $scope.totalCusts = repeatChart.totalCusts;
                $scope.contentLoaded = true;
              }
            );
            //then build the  second two ahead of time
            chartBuilder.buildTotalUsers(); 
            chartBuilder.buildEngagementChart(); 

          }
        );
      }
    }
    );
}]);
