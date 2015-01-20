'use strict';

angular.module('paradropApp')
  .directive('compareTo', function() {

    function linkFunc (scope, element, attrs, ngModel) {
      ngModel.$validators.compareTo = function (modelValue) {
        return modelValue === scope.otherModelValue;
      };

      scope.$watch('otherModelValue', function () {
        ngModel.$validate();
      });
    }

    //return obj
    return {
      require:  'ngModel',
      scope:    {
        otherModelValue: '=compareTo'
      },
      link:     linkFunc
    };
  });
