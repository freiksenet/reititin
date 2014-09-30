"use strict";

describe("Router creation", function () {
  it("must accept all the ways to define routes", function () {
    var reititin = require('../reititin');
    new reititin.Router();
    expect(true).toBe(true);
  });
});
