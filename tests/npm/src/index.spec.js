const index = require("./index");

describe("sample function", () => {
  it('should return "sample"', () => {
    const result = index.sample();
    expect(result).toBe("sample");
  });
});
