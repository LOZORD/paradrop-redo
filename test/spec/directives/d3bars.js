'use strict';

describe('Directive: d3bars', function () {

  // load the directive's module
  beforeEach(module('paradropApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<d3bars></d3bars>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the d3bars directive');
  }));
});
