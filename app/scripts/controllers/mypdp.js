'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MyParadropCtrl
 * @description
 * # MyParadropCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MyParadropCtrl', ['AuthService', '$scope', 
    function (AuthService, $scope) {
      $scope.restoreSession.promise.then($scope.authorizePage)
      .then(function(authorized) {
        if(authorized){
          $scope.groups = {};
          $scope.grouplessAPS = [];
          var names = [];
          for (var i =0; i < $scope.currentUser().aps.length; i++){
            var ap = $scope.currentUser().aps[i];
            //make list of groups with aps and names with/without whitespace
            if(ap.groupname){
              var name = {full: ap.groupname, trim: ap.groupname.replace(' ','')};
              if(names.indexOf(ap.groupname) === -1){
                names.push(ap.groupname);
                $scope.groups[name.trim] = name;
              }
              if($scope.groups[name.trim].aps === undefined){
                $scope.groups[name.trim].aps = [ap];
              }else{
                $scope.groups[name.trim].aps.push(ap);
              }
            }else{
              $scope.grouplessAPS.push(ap);
            }
          }
          //extend groups to entire width if no ungrouped APS
          $scope.groupWidth = 6;
          $scope.grouplessWidth = 6;
          if($scope.grouplessAPS.length === 0){
            $scope.groupWidth = 12;
          }
          if(!$scope.currentUser().defaultGroup){
            $scope.grouplessWidth = 12;
          }
          //if only one group uncollapse it
          if(Object.keys($scope.groups).length === 1){
            $scope.uncollapse = 'in';
            $scope['group' + names[0].replace(' ','')] = {};
            $scope['group' + names[0].replace(' ','')].open = true;
          }
        }
      }
    );
  }]);
