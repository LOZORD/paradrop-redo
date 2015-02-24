'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MapSettingsCtrl
 * @description
 * # MapSettingsCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MapSettingsCtrl',['$scope', 'URLS', '$http', '$sce', '$routeParams', 'gmapMaker', '$localStorage', '$route',
    function ($scope, URLS, $http, $sce, $routeParams, gmapMaker, $localStorage, $route) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      var group = $scope.group_id.toString();
      $scope.settingsJSON = {};
      $scope.authorizePage()
      .then(function(authorized){
        if(authorized){
          var mapInitURL = URLS.current + 'recon/maps/init';
          var postBody = { sessionToken: $scope.sessionToken() };
          $http.post(mapInitURL, postBody ).then(
              function(groupMaps){
                $scope.mapsArray = groupMaps.data;
                for(var i in $scope.mapsArray){
                  if($scope.mapsArray[i].groupname == $scope.group_id){
                    $scope.groupMaps = $scope.mapsArray[i];
                    break;
                  }
                }
                if($localStorage.mapSettings && $localStorage.mapSettings[group]){
                  $scope.mapData = $localStorage.mapSettings[group];
                }else{
                  $scope.mapData = $scope.groupMaps.data;
                }
                $scope.settingsJSON = angular.copy($scope.mapData);
                var builtMap = gmapMaker.buildMap($scope.mapData);
                $scope.apNameMap = $scope.groupMaps.map;
                $scope.revApNameMap = {};
                for(var key in $scope.apNameMap){
                  $scope.revApNameMap[$scope.apNameMap[key].apid] = $scope.apNameMap[key].name;
                }
                $scope.firstFloorMapType = builtMap.mapType;
                $scope.onClick = function(event) {
                  var ll = event.latLng;
                  console.log('Lat: ' + ll.lat(), ' Lng: ' + ll.lng());
                  $scope.showLocation = true;
                  $scope.coords = { lat: ll.lat(), lng: ll.lng() };
                  $scope.infobox.open($scope.map, $scope.map.markers.info);
                  $scope.infobox.setPosition($scope.coords);
                  $scope.infobox
                    .setContent('<div>Lat: '+$scope.coords.lat+'</div>'
                        + '<div>Lng: '+$scope.coords.lng+'</div>');
                };
                $scope.$on('mapInitialized', function(event, map) {
                  $scope.map = map;
                  $scope.infobox = map.infoWindows.info;
                  setTimeout(function(){$scope.map.markers.infoMarker.setVisible(false);},0);
                });
                $scope.mapReady = true;
              }
          , function(error){$scope.mapError = true;});
        };
      });

      $scope.updateMarkers = function() {
        $scope.settingsJSON.aps = [];
        for(var marker in $scope.map.markers){
          var marker = {apid: marker, lat: $scope.map.markers[marker].position.k, lng: $scope.map.markers[marker].position.D };
          $scope.settingsJSON.aps.push(marker);
        }
        console.log($scope.settingsJSON);
        console.log('******************');
      };

      $scope.revert = function() {
        $scope.settingsJSON = angular.copy($scope.mapData);
        $scope.updateMarkers();
      };

      $scope.revertMarkers = function() {
        for(var ap in $scope.mapData.aps){
          $scope.map.markers[$scope.mapData.aps[ap].apid]
            .setPosition(new google.maps
            .LatLng($scope.mapData.aps[ap].lat, $scope.mapData.aps[ap].lng));
        }
        $scope.updateMarkers();
      };

      $scope.submitChanges = function(){
        $scope.updateMarkers();
        for(var key in $scope.settingsJSON){
          if($scope.settingsJSON[key] === undefined 
              || $scope.settingsJSON[key] === "" 
              || $scope.settingsJSON[key] === null)
          {
            alert('Reverting settings due to invalid value for: ' + key);
            $scope.revert();
            return;
          }
        }
        console.log("Validation successful ready to send JSON");
        console.log($scope.settingsJSON);
        if(!$localStorage.mapSettings){
          $localStorage.mapSettings = {};
        }
        $localStorage.mapSettings[group] = $scope.settingsJSON
        console.log($localStorage.mapSettings);
        $route.reload();
      };

      $scope.destroyCookie = function(){
        if($localStorage.mapSettings){
          delete $localStorage.mapSettings[group];
          var i = 0;
          for(var key in $localStorage.mapSettings){
            i++;
          }
          if(i === 0){
            delete $localStorage.mapSettings;
          }
          console.log($localStorage.mapSettings);
          $route.reload();
        }
        console.log($localStorage.mapSettings);
      };
  }]);
