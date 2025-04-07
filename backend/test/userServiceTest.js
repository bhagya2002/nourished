const sinon = require("sinon");
const db = require("../firebase/firestore");
const userService = require("../services/userService");
const inviteService = require("../services/inviteService");
const assert = require("assert");

describe("userService Tests", function () {
  afterEach(() => {
    sinon.restore();
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


      sinon.stub(db, "queryDatabaseSingle").returns(expectedUserData);

      const result = await userService.getUserInfo("user123");
      assert.deepStrictEqual(result, expectedUserData);
    });
  });

  describe("addFriendConnection", function () {
    it("should return true when both users are updated successfully", async function () {

      const dbStub = sinon.stub(db, "updateFieldArray").resolves(true);

      const result = await userService.addFriendConnection("userA", "userB");
      assert.strictEqual(result, true);


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


      sinon
        .stub(db, "queryDatabaseSingle")
        .resolves({ data: { friends: userFriendsIds } });
      sinon.stub(db, "queryMultiple").resolves({ data: userFriends });

      const recommendations = await userService.getFriendRecommendations(uid);
      assert.deepStrictEqual(recommendations, ["user4", "user5"]);
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
      assert.deepStrictEqual(recommendations, ["user3", "user4"]);
    });
  });

  describe("followUser", function () {
    it("should successfully follow a user and send a friend invite", async function () {
      sinon.stub(db, "updateFieldArray").resolves(true);
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { name: "John Doe", followers: [] },
      });
      sinon.stub(inviteService, "createInvite").resolves({ success: true });

      const result = await userService.followUser("user123", "user456");
      assert.deepStrictEqual(result, { success: true });
    });

    it("should return an error if updating the follower's following list fails", async function () {
      sinon
        .stub(db, "updateFieldArray")
        .withArgs("users", "user123", "following", "user456")
        .resolves(false);

      const result = await userService.followUser("user123", "user456");
      assert.deepStrictEqual(result, { success: false });
    });

    it("should return an error if updating the followee's followers list fails", async function () {
      sinon
        .stub(db, "updateFieldArray")
        .withArgs("users", "user123", "following", "user456")
        .resolves(true)
        .withArgs("users", "user456", "followers", "user123")
        .resolves(false);

      const result = await userService.followUser("user123", "user456");
      assert.deepStrictEqual(result, { success: false });
    });

    it("should add both users to the friends list if they already follow each other", async function () {
      sinon.stub(db, "updateFieldArray").resolves(true);
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { name: "John Doe", followers: ["user456"] },
      });

      const result = await userService.followUser("user123", "user456");
      assert.deepStrictEqual(result, { success: true });
    });

    it("should return an error if creating a friend invite fails", async function () {
      sinon.stub(db, "updateFieldArray").resolves(true);
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { name: "John Doe", followers: [] },
      });
      sinon.stub(inviteService, "createInvite").resolves({ success: false });

      const result = await userService.followUser("user123", "user456");
      assert.deepStrictEqual(result, { success: false });
    });
  });

  describe("unfollowUser", function () {
    it("should successfully unfollow a user and remove them from the friends list", async function () {
      sinon.stub(db, "removeFromFieldArray").resolves(true);
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { friends: ["user456"] },
      });

      const result = await userService.unfollowUser("user123", "user456");
      assert.deepStrictEqual(result, { success: true });
    });

    it("should return an error if removing the follower's following list fails", async function () {
      sinon
        .stub(db, "removeFromFieldArray")
        .withArgs("users", "user123", "following", "user456")
        .resolves(false);

      const result = await userService.unfollowUser("user123", "user456");
      assert.deepStrictEqual(result, { success: false });
    });

    it("should return an error if removing the followee's followers list fails", async function () {
      sinon
        .stub(db, "removeFromFieldArray")
        .withArgs("users", "user123", "following", "user456")
        .resolves(true)
        .withArgs("users", "user456", "followers", "user123")
        .resolves(false);

      const result = await userService.unfollowUser("user123", "user456");
      assert.deepStrictEqual(result, { success: false });
    });

    it("should return an error if deleting a friend invite fails", async function () {
      sinon.stub(db, "removeFromFieldArray").resolves(true);
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { friends: [] },
      });
      sinon.stub(inviteService, "deleteFriendInvite").resolves({
        success: false,
      });

      const result = await userService.unfollowUser("user123", "user456");
      assert.deepStrictEqual(result, { success: false });
    });
  });

  describe("getFollowers", function () {
    it("should return a list of followers successfully", async function () {
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { followers: ["user456", "user789"] },
      });

      const result = await userService.getFollowers("user123");
      assert.deepStrictEqual(result, {
        success: true,
        data: ["user456", "user789"],
      });
    });

    it("should return an error if fetching followers fails", async function () {
      sinon
        .stub(db, "queryDatabaseSingle")
        .rejects(new Error("Database error"));

      const result = await userService.getFollowers("user123");
      assert.deepStrictEqual(result, {
        success: false,
        err: new Error("Database error"),
      });
    });
  });

  describe("getFollowing", function () {
    it("should return a list of following users successfully", async function () {
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { following: ["user456", "user789"] },
      });

      const result = await userService.getFollowing("user123");
      assert.deepStrictEqual(result, {
        success: true,
        data: ["user456", "user789"],
      });
    });

    it("should return an error if fetching following users fails", async function () {
      sinon
        .stub(db, "queryDatabaseSingle")
        .rejects(new Error("Database error"));

      const result = await userService.getFollowing("user123");
      assert.deepStrictEqual(result, {
        success: false,
        err: new Error("Database error"),
      });
    });
  });

  describe("searchUser", function () {
    it("should return users matching the search keyword", async function () {
      sinon
        .stub(db, "queryDatabaseFuzzy")
        .withArgs("John", "users", "name")
        .resolves({
          success: true,
          data: [{ uid: "user123", name: "John Doe" }],
        })
        .withArgs("John", "users", "email")
        .resolves({
          success: true,
          data: [{ uid: "user456", email: "john@example.com" }],
        });

      const result = await userService.searchUser({ keyword: "John" });
      assert.deepStrictEqual(result, {
        success: true,
        data: [
          { uid: "user123", name: "John Doe" },
          { uid: "user456", email: "john@example.com" },
        ],
      });
    });

    it("should return an error if searching for users fails", async function () {
      sinon.stub(db, "queryDatabaseFuzzy").rejects(new Error("Search error"));

      const result = await userService.searchUser({ keyword: "John" });
      assert.deepStrictEqual(result, {
        success: false,
        err: new Error("Search error"),
      });
    });
  });
});
