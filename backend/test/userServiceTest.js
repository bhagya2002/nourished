const sinon = require("sinon");
const db = require("../firebase/firestore");
const userService = require("../services/userService");
const assert = require("assert");

describe("userServiceTests", function () {
  it("should return unedited data", async function () {
    const expected = {
      tasks: [],
      goals: [],
      friends: [],
      uid: "xXBvrDlSBqZceNDt5JcHu9C8iEI3",
      name: "Scott Dick",
      email: "scott@email.com",
      createdAt: {
        _seconds: 1738948607,
        _nanoseconds: 141000000,
      },
    };
    sinon.stub(db, "queryDatabaseSingle").returns(expected);
    const result = await userService.getUserInfo(
      "xXBvrDlSBqZceNDt5JcHu9C8iEI3"
    );
    assert.equal(expected, result);
  });

  it("should pass through args and append proper collection", async function () {
    const input = "xXBvrDlSBqZceNDt5JcHu9C8iEI3";
    const dbStub = sinon.stub(db, "queryDatabaseSingle");
    await userService.getUserInfo(input);
    sinon.assert.calledOnceWithExactly(dbStub, input, "users");
  });
});
