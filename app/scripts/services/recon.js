'use strict';

/**
 * @ngdoc service
 * @name paradropApp.Recon
 * @description
 * # Recon
 * Service in the paradropApp.
 */
angular.module('paradropApp')
  .service('Recon',[ 'Session', 'URLS', '$http', '$rootScope', '$q',function (Session, URLS, $http, $rootScope, $q) {

    $rootScope.reconInit = $q.defer();
    this.recon = null;
    var self = this;

    $rootScope.sessionBuilt.promise.then(function(){
      var post = function(url, args){
        //Inject the session token into the args list to POST
        args.sessionToken = Session.id;
        console.log('POST to: ' + URLS.current.substr(0, URLS.current.length-4) + url);
        var call = $http.post(URLS.current.substr(0, URLS.current.length-4) + url, args);
        return call;
      }

      self.recon = new Recon( { postFunc: post} );
        var openTime = new Date();
        var closeTime = new Date();
        if(openTime.getHours() < 9){
          openTime.setDate(openTime.getDate() -1);
          closeTime.setDate(closeTime.getDate() -1);
          closeTime.setHours(19);
        }
        openTime.setHours(9);
        openTime.setMinutes(0);
        openTime.setSeconds(0);
        openTime.setMilliseconds(0);
        openTime = Math.floor(openTime.getTime() / 1000);
        if(closeTime.getHours() > 19){
          closeTime.setHours(19);
        }
        closeTime = Math.floor(closeTime.getTime() / 1000);

      var opts = { 
        start: Math.floor(openTime),
        stop: Math.floor(closeTime),
        groupName: Session.defaultGroup
      };

      self.recon.prefetch(opts)
      .then(function(){
        $rootScope.reconInit.resolve();
      });

    });
    return this.recon;
  }]);
