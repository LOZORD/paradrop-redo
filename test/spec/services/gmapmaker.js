'use strict';

describe('Service: gmapMaker', function () {

  // load the service's module
  beforeEach(module('paradropApp'));

  // instantiate service
  var gmapMaker;
  beforeEach(inject(function (_gmapMaker_) {
    gmapMaker = _gmapMaker_;
  }));

  it('should do something', function () {
    expect(!!gmapMaker).toBe(true);
  });

});
