'use strict';

angular.module('paradropApp', [])
  .directive('formAutofillFix', ['$timeout',
    function ($timeout) {
      function ret (scope, element, attrs) {
        element.prop('method', 'post');
        
        if (attrs.ngSubmit) {
          $timeout(function () {
            element
              .unbind('submit')
              .bind('submit', function (event) {
                event.preventDefault();
                element
                  .find('input, textarea, select')
                  .trigger('input')
                  .trigger('change')
                  .trigger('keydown');
                
                scope.$apply(attrs.ngSubmit);
              });
          });
        }
      };
    }
  ]);
