const sinon = require("sinon");
const db = require("../firebase/firestore");
const userService = require("../services/userService");
const assert = require("assert");

describe("userService Tests", function () {
  afterEach(() => {
    sinon.restore(); // Restore original methods after each test
  });

  describe("getUserInfo", function () {
    it("should return user data from the database", async function () {
      const expectedUserData = {
        tasks: [],
        goals: [],
        friends: [],
        uid: "user123",
        name: "John Doe",
        email: "john@example.com",
        createdAt: {
          _seconds: 1738948607,
          _nanoseconds: 141000000,
        },
      };

      // Stub db.queryDatabaseSingle to return expectedUserData
      sinon.stub(db, "queryDatabaseSingle").returns(expectedUserData);

      const result = await userService.getUserInfo("user123");
      assert.deepStrictEqual(result, expectedUserData);
    });
  });

  describe("addFriendConnection", function () {
    it("should return true when both users are updated successfully", async function () {
      // Stub db.updateFieldArray to return true for both calls
      const dbStub = sinon.stub(db, "updateFieldArray").resolves(true);

      const result = await userService.addFriendConnection("userA", "userB");
      assert.strictEqual(result, true);

      // Ensure db.updateFieldArray was called correctly
      sinon.assert.calledWithExactly(
        dbStub.firstCall,
        "users",
        "userA",
        "friends",
        "userB",
      );
      sinon.assert.calledWithExactly(
        dbStub.secondCall,
        "users",
        "userB",
        "friends",
        "userA",
      );
    });

    it("should return false if updating the first user fails", async function () {
      const dbStub = sinon.stub(db, "updateFieldArray");
      dbStub.withArgs("users", "userA", "friends", "userB").resolves(false);
      dbStub.withArgs("users", "userB", "friends", "userA").resolves(true);

      const result = await userService.addFriendConnection("userA", "userB");
      assert.strictEqual(result, false);
    });

    it("should return false if updating the second user fails", async function () {
      const dbStub = sinon.stub(db, "updateFieldArray");
      dbStub.withArgs("users", "userA", "friends", "userB").resolves(true);
      dbStub.withArgs("users", "userB", "friends", "userA").resolves(false);

      const result = await userService.addFriendConnection("userA", "userB");
      assert.strictEqual(result, false);
    });
  });

  describe("getFriendRecommendations", function () {
    it("should return top 2 recommended friends based on mutual connections", async function () {
      const uid = "user1";
      const userFriendsIds = ["user2", "user3"];
      const userFriends = [
        { friends: ["user4", "user5", "user6"] },
        { friends: ["user4", "user7", "user5"] },
      ];

      // Stub database calls
      sinon
        .stub(db, "queryDatabaseSingle")
        .resolves({ data: { friends: userFriendsIds } });
      sinon.stub(db, "queryMultiple").resolves({ data: userFriends });

      const recommendations = await userService.getFriendRecommendations(uid);
      assert.deepStrictEqual(recommendations, ["user4", "user5"]); // Highest frequency users
    });

    it("should return an empty array if the user has no friends", async function () {
      const uid = "user1";
      sinon.stub(db, "queryDatabaseSingle").resolves({ data: { friends: [] } });
      sinon.stub(db, "queryMultiple").resolves({ data: [] });

      const recommendations = await userService.getFriendRecommendations(uid);
      assert.deepStrictEqual(recommendations, []);
    });

    it("should exclude the user themselves from recommendations", async function () {
      const uid = "user1";
      const userFriendsIds = ["user2"];
      const userFriends = [{ friends: ["user1", "user3", "user4"] }];

      sinon
        .stub(db, "queryDatabaseSingle")
        .resolves({ data: { friends: userFriendsIds } });
      sinon.stub(db, "queryMultiple").resolves({ data: userFriends });

      const recommendations = await userService.getFriendRecommendations(uid);
      assert.deepStrictEqual(recommendations, ["user3", "user4"]); // Excludes "user1"
    });
  });
});
