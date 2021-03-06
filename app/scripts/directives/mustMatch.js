'use strict';
/*
This directive ensures that a slave input matches the current
value of a master input.

Main usage: password confirmation
*/
angular.module('paradropApp')
  .directive('mustMatch', function() {

    function linkFunc (scope, element, attrs, ngModel) {
      ngModel.$validators.mustMatch = function (slaveValue) {
        return (slaveValue === scope.masterValue);
      };

      scope.$watch('masterValue', function () {
        ngModel.$validate();
      });
    }

    //return obj
    return {
      require:  'ngModel',
      scope:    {
        masterValue: '=mustMatch'
      },
      link:     linkFunc
    };
  });
