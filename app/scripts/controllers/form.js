'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:FormCtrl
 * @description
 * # FormCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('FormCtrl',['$scope', '$http', function ($scope, $http) {
    $scope.submitContact = function(){
        var postBody = {name: $scope.contact.name, email: $scope.contact.email, message: $scope.contact.message};
        var url = 'https://dbapi.paradrop.io/v1/interest';
        $http.post(url, postBody)
        .then(function() {
            $scope.closeAlerts();
            $scope.successAlert('Thank you for signing up!');

        });
    };

  }]);
