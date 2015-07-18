'use strict';

describe('Controller: InfousersCtrl', function () {

  // load the controller's module
  beforeEach(module('paradropApp'));

  var InfousersCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    InfousersCtrl = $controller('InfousersCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
