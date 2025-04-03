const { expect } = require("chai");
const sinon = require("sinon");
const { beforeEach, afterEach, describe, it } = require("mocha");
const db = require("../firebase/firestore");
const postService = require("../services/postService");

describe("postService", function () {
  let dbStub;

  beforeEach(function () {
    dbStub = {
      queryDatabaseSingle: sinon.stub(db, "queryDatabaseSingle"),
      queryMultiple: sinon.stub(db, "queryMultiple"),
      addSingleDoc: sinon.stub(db, "addSingleDoc"),
      updateFieldArray: sinon.stub(db, "updateFieldArray"),
      removeFromFieldArray: sinon.stub(db, "removeFromFieldArray"),
      deleteSingleDoc: sinon.stub(db, "deleteSingleDoc"),
      updateField: sinon.stub(db, "updateField"),
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  describe("createPost", function () {
    it("should create a post successfully", async function () {
      const uid = "user123";
      const post = { name: "Post Name", goalId: "goal123" };
      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { name: "User Name" },
      });
      dbStub.addSingleDoc.resolves({ success: true, id: "post123" });
      dbStub.updateFieldArray.resolves({ success: true });
      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { title: "Goal Title" },
      });

      const result = await postService.createPost(uid, post);
      expect(result.success).to.be.true;
      expect(result.data.post.id).to.equal("post123");
    });

    it("should return an error if post creation fails", async function () {
      const uid = "user123";
      const post = { name: "Post Name" };
      dbStub.addSingleDoc.resolves({
        success: false,
        error: "Failed to create post",
      });

      const result = await postService.createPost(uid, post);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to create post",
      });
    });

    it("should return an error if updating user posts fails", async function () {
      const uid = "user123";
      const post = { name: "Post Name" };
      dbStub.addSingleDoc.resolves({ success: true, id: "post123" });
      dbStub.updateFieldArray.resolves({
        success: false,
        error: "Failed to update user posts",
      });

      const result = await postService.createPost(uid, post);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to update user posts",
      });
    });

    it("should return an error if goal retrieval fails", async function () {
      const uid = "user123";
      const post = { name: "Post Name", goalId: "goal123" };
      dbStub.addSingleDoc.resolves({ success: true, id: "post123" });
      dbStub.updateFieldArray.resolves({ success: true });
      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "Goal not found",
      });

      const result = await postService.createPost(uid, post);
      expect(result).to.deep.equal({ success: false, error: "Goal not found" });
    });
  });

  describe("editPost", function () {
    it("should edit a post successfully", async function () {
      const uid = "user123";
      const postId = "post123";
      const fieldToChange = "title";
      const newValue = "Updated Title";
      dbStub.queryDatabaseSingle.resolves({ success: true });
      dbStub.updateField.resolves({ success: true });

      const result = await postService.editPost(
        uid,
        postId,
        fieldToChange,
        newValue,
      );
      expect(result.success).to.be.true;
    });

    it("should return an error if user is not found", async function () {
      const uid = "user123";
      const postId = "post123";
      const fieldToChange = "title";
      const newValue = "Updated Title";
      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "User not found",
      });

      const result = await postService.editPost(
        uid,
        postId,
        fieldToChange,
        newValue,
      );
      expect(result).to.deep.equal({ success: false, error: "User not found" });
    });
  });

  describe("getUserWithFriendPosts", function () {
    it("should return posts from user and friends", async function () {
      const uid = "user123";
      const user = { friends: ["friend1"], following: ["friend2"] };
      dbStub.queryDatabaseSingle.resolves({ success: true, data: user });
      sinon
        .stub(postService, "getUserPosts")
        .withArgs("user123")
        .resolves({ success: true, data: [{ id: "post1" }] })
        .withArgs("friend1")
        .resolves({ success: true, data: [{ id: "post2" }] })
        .withArgs("friend2")
        .resolves({ success: true, data: [{ id: "post3" }] });

      const result = await postService.getUserWithFriendPosts(uid);
      expect(result.success).to.be.true;
      expect(result.data).to.have.length(3);
    });

    it("should return an error if user is not found", async function () {
      const uid = "user123";
      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "User not found",
      });

      const result = await postService.getUserWithFriendPosts(uid);
      expect(result).to.deep.equal({ success: false, error: "User not found" });
    });
  });

  describe("getUserPosts", function () {
    it("should return user posts with goals", async function () {
      const uid = "user123";
      const posts = [{ id: "post1", goalId: "goal1" }];
      const goal = { title: "Goal Title" };
      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { posts: ["post1"] },
      });
      dbStub.queryMultiple.resolves({ success: true, data: posts });
      dbStub.queryDatabaseSingle.resolves({ success: true, data: goal });

      const result = await postService.getUserPosts(uid);
      expect(result.success).to.be.true;
      expect(result.data[0].goal).to.deep.equal(goal);
    });

    it("should return an error if user is not found", async function () {
      const uid = "user123";
      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "User not found",
      });

      const result = await postService.getUserPosts(uid);
      expect(result).to.deep.equal({ success: false, error: "User not found" });
    });
  });

  describe("deletePost", function () {
    it("should delete a post successfully", async function () {
      const uid = "user123";
      const postId = "post123";
      dbStub.removeFromFieldArray.resolves({ success: true });
      dbStub.deleteSingleDoc.resolves({ success: true });

      const result = await postService.deletePost(uid, postId);
      expect(result.success).to.be.true;
    });

    it("should return an error if removing post from user fails", async function () {
      const uid = "user123";
      const postId = "post123";
      dbStub.removeFromFieldArray.resolves({
        success: false,
        error: "Failed to remove post",
      });

      const result = await postService.deletePost(uid, postId);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to remove post",
      });
    });
  });

  describe("likePost", function () {
    it("should like a post successfully", async function () {
      const uid = "user123";
      const postId = "post123";
      const post = { likes: [] };
      dbStub.queryDatabaseSingle.resolves({ success: true, data: post });
      dbStub.updateFieldArray.resolves({ success: true });
      dbStub.removeFromFieldArray.resolves({ success: true });

      const result = await postService.likePost(uid, postId);
      expect(result.success).to.be.true;
      expect(result.data.post.likes).to.include(uid);
    });

    it("should unlike a post successfully", async function () {
      const uid = "user123";
      const postId = "post123";
      const post = { likes: ["user123"] };
      dbStub.queryDatabaseSingle.resolves({ success: true, data: post });
      dbStub.updateFieldArray.resolves({ success: true });
      dbStub.removeFromFieldArray.resolves({ success: true });

      const result = await postService.likePost(uid, postId);
      expect(result.success).to.be.true;
      expect(result.data.post.likes).to.not.include(uid);
    });

    it("should return an error if post is not found", async function () {
      const uid = "user123";
      const postId = "post123";
      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "Post not found",
      });

      const result = await postService.likePost(uid, postId);
      expect(result).to.deep.equal({ success: false, error: "Post not found" });
    });
  });
});
