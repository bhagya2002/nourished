const { expect } = require("chai");
const sinon = require("sinon");
const { beforeEach, afterEach, describe, it } = require("mocha");
const db = require("../firebase/firestore");
const commentService = require("../services/commentService");

describe("commentService", function () {
  let dbStub;

  beforeEach(function () {
    dbStub = {
      queryDatabaseSingle: sinon.stub(db, "queryDatabaseSingle"),
      queryMultiple: sinon.stub(db, "queryMultiple"),
      addSingleDoc: sinon.stub(db, "addSingleDoc"),
      updateFieldArray: sinon.stub(db, "updateFieldArray"),
      removeFromFieldArray: sinon.stub(db, "removeFromFieldArray"),
      deleteSingleDoc: sinon.stub(db, "deleteSingleDoc"),
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  describe("getCommentsOnPost", function () {
    it("should return comments when post and comments are found", async function () {
      const postId = "post123";
      const post = { comments: ["comment1", "comment2"] };
      const comments = [{ id: "comment1" }, { id: "comment2" }];

      dbStub.queryDatabaseSingle.resolves({ success: true, data: post });
      dbStub.queryMultiple.resolves({ success: true, data: comments });

      const result = await commentService.getCommentsOnPost(postId);
      expect(result).to.deep.equal({ success: true, data: comments });
    });

    it("should return an error if post is not found", async function () {
      const postId = "post123";

      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "Post not found",
      });

      const result = await commentService.getCommentsOnPost(postId);
      expect(result).to.deep.equal({ success: false, error: "Post not found" });
    });

    it("should return an error if comments are not found", async function () {
      const postId = "post123";
      const post = { comments: ["comment1", "comment2"] };

      dbStub.queryDatabaseSingle.resolves({ success: true, data: post });
      dbStub.queryMultiple.resolves({
        success: false,
        error: "Comments not found",
      });

      const result = await commentService.getCommentsOnPost(postId);
      expect(result).to.deep.equal({
        success: false,
        error: "Comments not found",
      });
    });
  });

  describe("createComment", function () {
    it("should create a comment and update the post successfully", async function () {
      const userId = "user123";
      const data = { postId: "post123", content: "New comment" };
      const commentId = "comment123";

      dbStub.addSingleDoc.resolves({ success: true, id: commentId });
      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { name: "User Name" },
      });
      dbStub.updateFieldArray.resolves({ success: true });

      const result = await commentService.createComment(userId, data);
      expect(result).to.deep.equal({ success: true, data: { id: commentId } });
    });

    it("should return an error if comment creation fails", async function () {
      const userId = "user123";
      const data = { postId: "post123", content: "New comment" };

      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { name: "User Name" },
      });
      dbStub.addSingleDoc.resolves({
        success: false,
        error: "Failed to create comment",
      });

      const result = await commentService.createComment(userId, data);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to create comment",
      });
    });

    it("should return an error if updating post comments fails", async function () {
      const userId = "user123";
      const data = { postId: "post123", content: "New comment" };
      const commentId = "comment123";

      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { name: "User Name" },
      });
      dbStub.addSingleDoc.resolves({ success: true, id: commentId });
      dbStub.updateFieldArray.resolves({
        success: false,
        error: "Failed to update post comments",
      });

      const result = await commentService.createComment(userId, data);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to update post comments",
      });
    });
  });

  describe("deleteComment", function () {
    it("should delete a comment and update the post successfully", async function () {
      const data = { postId: "post123", commentId: "comment123" };

      dbStub.deleteSingleDoc.resolves({ success: true });
      dbStub.removeFromFieldArray.resolves({ success: true });

      const result = await commentService.deleteComment(data);
      expect(result).to.deep.equal({ success: true });
    });

    it("should return an error if comment deletion fails", async function () {
      const data = { postId: "post123", commentId: "comment123" };

      dbStub.deleteSingleDoc.resolves({
        success: false,
        error: "Failed to delete comment",
      });

      const result = await commentService.deleteComment(data);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to delete comment",
      });
    });

    it("should return an error if updating post comments fails", async function () {
      const data = { postId: "post123", commentId: "comment123" };

      dbStub.deleteSingleDoc.resolves({ success: true });
      dbStub.removeFromFieldArray.resolves({
        success: false,
        error: "Failed to update post comments",
      });

      const result = await commentService.deleteComment(data);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to update post comments",
      });
    });
  });
});
