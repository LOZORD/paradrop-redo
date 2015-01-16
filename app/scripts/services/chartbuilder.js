'use strict';

/**
 * @ngdoc service
 * @name paradropApp.chartBuilder
 * @description
 * # chartBuilder
 * Factory in the paradropApp.
 */
angular.module('paradropApp')
  .factory('chartBuilder',['Recon', '$rootScope', 'DEV_MODE', function (Recon, $rootScope, DEV_MODE) {
    // Service logic
    // ...

    var charts = {};
    this.totalUsersChart = null;
    this.repeatVisitsChart = null;
    this.engagementChart = null;

    charts.getBuiltCharts = function(){
      if(!this.totalUsersChart || !this.engagementChart){
        return null;
      }else{
        return {
          totalUsers: this.totalUsersChart,
          repeatVisits: this.repeatVisitsChart,
          engagement: this.engagementChart
        }
      }
    }

    // Public API here
    charts.buildTotalUsers = function(){
      var chartInfo = {};
      var startts;
      var stopts;
      if(DEV_MODE){
        startts = 1419175642;
        stopts = 1419262042;
      }else{
        stopts = Date.now() / 1000;
        startts = stopts - 86400;
      }
      console.log(Recon.recon);
      var graphData = Recon.recon.getTotalGroupByTS(startts, stopts, 3600);
      var plot = [];
      var xTimes = [];
      for(var i = 0; i < graphData.x.length; i++){ 
        var time = new Date(graphData.x[i] * 1000);
        var hours = time.getHours();
        var suffix = '';
        if(hours >= 12){
          suffix = 'PM';
          if(hours >= 13){
            hours -= 12;
          }
        }else{
          suffix = 'AM';
          if(hours == 0){
            hours = 12;
          }
        }
        xTimes.push(hours + ':' + time.getMinutes() + suffix);
        plot.push({name: xTimes[i], y: graphData.y[i]});
      }
      var chartConfig = {
        //This is not a highcharts object. It just looks a little like one!
        options: {
          //This is the Main Highcharts chart config. Any Highchart options are valid here.
          //will be ovverriden by values specified below.
          chart: {
            type: 'line'
          },
          tooltip: {
            style: {
              padding: 10,
              fontWeight: 'bold'
            }
          }
        },

        //The below properties are watched separately for changes.

        //Series object (optional) - a list of series using normal highcharts series options.
        series: [{
          data: plot,
          name: 'Total Users'
        }],
        //Title configuration (optional)
        title: {
          text: 'Total Users'
        },
        //Boolean to control showng loading status on chart (optional)
        //Could be a string if you want to show specific loading text.
        loading: false,
        //Configuration for the xAxis (optional). Currently only one x axis can be dynamically controlled.
        //properties currentMin and currentMax provied 2-way binding to the chart's maximimum and minimum
        xAxis: {
          categories: xTimes,
          title: {text: 'Time'},
          labels: {
            step: 4,
            maxStaggerLines: 1
          }
        },
        yAxis: {
         title: {text: 'Total Users'},
         floor: 0
        },
        //Whether to use HighStocks instead of HighCharts (optional). Defaults to false.
        useHighStocks: false,
        //size (optional) if left out the chart will default to size of the div or something sensible.
        //function (optional)
        func: function (chart) {
          //setup some logic for the chart
          chartInfo.chart = chart;
        }

      };
      chartInfo.chartConfig = chartConfig;
      this.totalUsersChart = chartInfo;
      return chartInfo;
    }

    charts.buildEngagementChart = function(){
      var chartInfo = {};
      var graphData = Recon.recon.getEngagementByTS([0, 300, 600, 900]);
      var total = graphData.y.reduce(function(prev,curr){return prev + curr;}); 

      var chartConfig = {
        //This is not a highcharts object. It just looks a little like one!
        options: {
          //This is the Main Highcharts chart config. Any Highchart options are valid here.
          //will be ovverriden by values specified below.
          chart: {
            type: 'pie'
          },
          tooltip: {
            style: {
              padding: 10,
              fontWeight: 'bold'
            }
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                style: {
                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                }
              }
            }
          }
        },

        //The below properties are watched separately for changes.

        //Series object (optional) - a list of series using normal highcharts series options.
        series: [{
          data: [['0-5 min', graphData.y[0]], ['5-10 min', graphData.y[1]],['10-15 min', graphData.y[2]],['15+ min', graphData.y[3]]],
          name: "# of Customers",
        }],
        //Title configuration (optional)
        title: {
          text: 'Length of Customer Engagement'
        },
        //Boolean to control showng loading status on chart (optional)
        //Could be a string if you want to show specific loading text.
        loading: false,
        useHighStocks: false,
        //function (optional)
        func: function (chart) {
          //setup some logic for the chart
          chartInfo.chart = chart;
        }

      };
      chartInfo.chartConfig = chartConfig;
      this.engagementChart = chartInfo;
      return chartInfo;
    }

    charts.buildRepeatVisitsChart = function(seenMacs){
      var chartInfo = {};
      var graphData = Recon.recon.getRepeatVisits(seenMacs);
      var chartConfig = {
        //This is not a highcharts object. It just looks a little like one!
        options: {
          //This is the Main Highcharts chart config. Any Highchart options are valid here.
          //will be ovverriden by values specified below.
          chart: {
            type: 'pie'
          },
          tooltip: {
            style: {
              padding: 10,
              fontWeight: 'bold'
            }
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                style: {
                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                }
              }
            }
          }
        },

        //The below properties are watched separately for changes.

        //Series object (optional) - a list of series using normal highcharts series options.
        series: [{
          data: [['New Customers', graphData.total - graphData.repeat], ['Repeat Customers', graphData.repeat]],
          name: "Number of Customers",
        }],
        //Title configuration (optional)
        title: {
          text: 'New vs. Repeat Customers'
        },
        //Boolean to control showng loading status on chart (optional)
        //Could be a string if you want to show specific loading text.
        loading: false,
        useHighStocks: false,
        //function (optional)
        func: function (chart) {
          //setup some logic for the chart
          chartInfo.chart = chart;
        }

      };
      chartInfo.chartConfig = chartConfig;
      chartInfo.totalCusts = graphData.total;
      this.repeatVisitsChart = chartInfo;
      return chartInfo;
    }

    return charts;
  }]);
