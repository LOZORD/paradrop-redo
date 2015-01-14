'use strict';

describe('Controller: ReconMapCtrl', function () {

  // load the controller's module
  beforeEach(module('paradropApp'));

  var ReconMapCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ReconMapCtrl = $controller('ReconMapCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
