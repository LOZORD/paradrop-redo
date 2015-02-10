'use strict';

/**
 * @ngdoc service
 * @name paradropApp.Recon
 * @description
 * # Recon
 * Service in the paradropApp.
 */
angular.module('paradropApp')
  .service('Recon',[ 'Session', 'URLS', '$http', '$rootScope', '$q', 'chartBuilder', function (Session, URLS, $http, $rootScope, $q, chartBuilder) {
    this.recon = null;
    this.nothing = function(){};
    var self = this;

    $rootScope.sessionBuilt.promise.then(function(){
      if(Session.defaultGroup){
        var post = function(url, args){
          //Inject the session token into the args list to POST
          args.sessionToken = Session.id;
          console.log('POST to: ' + URLS.current.substr(0, URLS.current.length-4) + url);
          var call = $http.post(URLS.current.substr(0, URLS.current.length-4) + url, args);
          return call;
        };

        self.recon = new Recon( { postFunc: post} );
        //setup prev and next day recon objects
        self.prev = new Recon( {postFunc: post} );
        self.next = null;
        //setup opts for prefetch

        var opts = {
          start: $rootScope.openTime,
          stop: $rootScope.closeTime,
          groupName: Session.defaultGroup
        };

        var today = new Date();
        today.setHours(18);
        today.setMinutes(59);
        today.setSeconds(59);
        today.setMilliseconds(0);
        today = Math.floor(today.getTime() / 1000);

        self.prevOpts = function(offset) {
          return {
            start: $rootScope.openTime - offset*86400,
            stop: today - offset*86400,
            groupName: Session.defaultGroup
          };
        };

        var currDay = 1;
        self.prevDay = function (enableButtons) {
          if(currDay < 8){
            self.next = self.recon;
            self.recon = self.prev;
            self.prev = new Recon( {postFunc: post} );
            $rootScope.reconDate = 'on ' + (new Date(self.recon.myOpts.start*1000)).toLocaleDateString();
            var graphData = self.recon
                            .getTotalGroupByTS(self.recon.myOpts.start, 
                              self.recon.myOpts.stop, 3600);
            chartBuilder.buildTotalUsers(graphData, 3600);
            graphData = self.recon.getEngagementByTS([0, 300, 600, 900]);
            chartBuilder.buildEngagementChart(graphData);
            graphData = self.recon.getRepeatVisits();
            chartBuilder.buildRepeatVisitsChart(graphData);
            chartBuilder.chartsBuilt();
            currDay++;
            self.prev.myOpts = self.prevOpts(currDay); 
            self.prev.prefetch(self.prevOpts(currDay)).then(enableButtons);
          }else{
            alert("You can only look at the last 7 days of data.");
            chartBuilder.chartsBuilt();
            enableButtons();
          }
          return {};
        };

        self.nextDay = function (enableButtons) {
          if(currDay > 2){
            currDay--;
            self.prev = self.recon;
            self.recon = self.next;
            self.next = new Recon( {postFunc: post} );
            $rootScope.reconDate = 'on ' + (new Date(self.recon.myOpts.start*1000)).toLocaleDateString();
            var graphData = self.recon.getTotalGroupByTS(self.recon.myOpts.start,
                              self.recon.myOpts.stop, 3600);
            chartBuilder.buildTotalUsers(graphData, 3600);
            graphData = self.recon.getEngagementByTS([0, 300, 600, 900]);
            chartBuilder.buildEngagementChart(graphData);
            graphData = self.recon.getRepeatVisits();
            chartBuilder.buildRepeatVisitsChart(graphData);
            chartBuilder.chartsBuilt();
            if(currDay-1 == 1){
              self.next.prefetch(opts).then(enableButtons);
            }else{
              self.next.myOpts = self.prevOpts(currDay-2);
              self.next.prefetch(self.prevOpts(currDay-2)).then(enableButtons);
            }
          }else if(currDay == 2){
            currDay--;
            self.prev = self.recon;
            self.recon = self.next;
            self.next = null;
            $rootScope.reconDate = 'on ' + (new Date($rootScope.openTime*1000)).toLocaleDateString();
            var stopts = $rootScope.closeTime;
            var startts = $rootScope.openTime;
            var graphData = self.recon.getTotalGroupByTS(startts,
                              stopts, $rootScope.granularity);
            chartBuilder.buildTotalUsers(graphData, $rootScope.granularity);
            graphData = self.recon.getEngagementByTS([0, 300, 600, 900]);
            chartBuilder.buildEngagementChart(graphData);
            graphData = self.recon.getRepeatVisits();
            chartBuilder.buildRepeatVisitsChart(graphData);
            chartBuilder.chartsBuilt();
            enableButtons();
          }else{
            alert("Today is the most recent day you can view data for.");
            chartBuilder.chartsBuilt();
            enableButtons();
          }
          return {};
        };

        self.recon.prefetch(opts)
        .then(function(){
          $rootScope.reconInit.resolve();
          var stopts = $rootScope.closeTime;
          var startts = $rootScope.openTime;
          var graphData = self.recon.getTotalGroupByTS(startts, stopts,
                            $rootScope.granularity);
          chartBuilder.buildTotalUsers(graphData, $rootScope.granularity);
          graphData = self.recon.getEngagementByTS([0, 300, 600, 900]);
          chartBuilder.buildEngagementChart(graphData);
          graphData = self.recon.getRepeatVisits();
          chartBuilder.buildRepeatVisitsChart(graphData);
          self.prev.myOpts = self.prevOpts(currDay); 
          self.prev.prefetch(self.prevOpts(currDay)).then(chartBuilder.chartsBuilt);
        });


      }
    });
    return this.recon;
  }]);
