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
      //setup opts for prefetch

      var opts = { 
        start: $rootScope.openTime,
        stop: $rootScope.closeTime,
        groupName: Session.defaultGroup
      };

      self.recon.prefetch(opts)
      .then(function(){
        $rootScope.reconInit.resolve();
      });

    });
    return this.recon;
  }]);
