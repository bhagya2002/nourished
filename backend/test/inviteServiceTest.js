const { expect } = require("chai");
const sinon = require("sinon");
const { afterEach, describe, it } = require("mocha");
const inviteService = require("../services/inviteService");
const userService = require("../services/userService");
const db = require("../firebase/firestore");

const assert = require("assert");

describe("inviteService Tests", function () {
  afterEach(() => {
    sinon.restore();
  });

  describe("createInvite", function () {
    it("should successfully create an invite", async function () {
      const mockResult = { success: true, id: "invite123" };
      sinon.stub(db, "addSingleDoc").resolves(mockResult);

      const result = await inviteService.createInvite("user123", {
        type: 0,
        invitee: "user456",
        targetId: "challenge789",
      });

      expect(result).to.deep.equal({ success: true, data: "invite123" });
    });

    it("should return an error if invite creation fails", async function () {
      const mockError = { success: false, error: "Database error" };
      sinon.stub(db, "addSingleDoc").resolves(mockError);

      const result = await inviteService.createInvite("user123", {
        type: 0,
        invitee: "user456",
      });

      expect(result).to.deep.equal({ success: false, error: "Database error" });
    });
  });

  describe("acceptInvite", function () {
    it("should accept a friend invite and update user documents", async function () {
      const batchStub = {
        delete: sinon.stub(),
        update: sinon.stub(),
        commit: sinon.stub().resolves(),
      };

      sinon.stub(db, "batch").returns(batchStub);
      sinon.stub(db, "getRef").returnsArg(1);
      sinon.stub(db, "getAddToArray").returnsArg(0);

      const result = await inviteService.acceptInvite("user123", {
        inviteId: "invite456",
        type: 0,
        invitee: "user789",
      });

      expect(result).to.deep.equal({ success: true });
    });

    it("should accept a challenge invite and update challenge participants", async function () {
      const batchStub = {
        delete: sinon.stub(),
        update: sinon.stub(),
        commit: sinon.stub().resolves(),
      };

      sinon.stub(db, "batch").returns(batchStub);
      sinon.stub(db, "getRef").returnsArg(1);
      sinon.stub(db, "getAddToArray").returnsArg(0);
      sinon
        .stub(db, "queryDatabaseSingle")
        .returns({ success: true, data: {} });
      sinon.stub(db, "updateFieldArray").returns({ success: true });

      const result = await inviteService.acceptInvite("user123", {
        inviteId: "invite789",
        type: 1,
        invitee: "user456",
        targetId: "challenge123",
      });

      expect(result).to.deep.equal({ success: true });
    });

    it("should return an error if the invite does not exist", async function () {
      sinon.stub(db, "batch").returns({
        delete: sinon.stub(),
        update: sinon.stub(),
        commit: sinon.stub().rejects(new Error("Invite not found")),
      });

      sinon.stub(db, "getRef").returnsArg(1);
      sinon.stub(db, "getAddToArray").returnsArg(0);

      const result = await inviteService.acceptInvite("user123", {
        inviteId: "invite789",
        type: 1,
        invitee: "user456",
        targetId: "challenge123",
      });

      expect(result).to.deep.equal({
        success: false,
        error: "Invite not found",
      });
    });
  });

  describe("getUserInvites", function () {
    it("should return all invites for a specific user", async function () {
      const mockInvites = {
        success: true,
        data: [
          { id: "invite1", inviter: "user123", invitee: "user456" },
          { id: "invite2", inviter: "user789", invitee: "user456" },
        ],
      };

      sinon.stub(db, "queryDatabase").resolves(mockInvites);

      const result = await inviteService.getUserInvites("user456");

      expect(result).to.deep.equal(mockInvites);
    });

    it("should return an empty array if the user has no invites", async function () {
      const mockInvites = { success: true, data: [] };
      sinon.stub(db, "queryDatabase").resolves(mockInvites);

      const result = await inviteService.getUserInvites("user456");

      expect(result).to.deep.equal({ success: true, data: [] });
    });
  });

  describe("declineInvite", function () {
    it("should successfully delete an invite", async function () {
      sinon.stub(db, "deleteSingleDoc").resolves({ success: true });

      const result = await inviteService.declineInvite({
        inviteId: "invite123",
      });

      expect(result).to.deep.equal({ success: true });
    });

    it("should return an error if the invite does not exist", async function () {
      sinon
        .stub(db, "deleteSingleDoc")
        .resolves({ success: false, error: "Invite not found" });

      const result = await inviteService.declineInvite({
        inviteId: "invite456",
      });

      expect(result).to.deep.equal({
        success: false,
        error: "Invite not found",
      });
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
