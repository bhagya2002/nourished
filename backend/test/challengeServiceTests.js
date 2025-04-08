const { expect } = require("chai");
const sinon = require("sinon");
const { beforeEach, afterEach, describe, it } = require("mocha");
const db = require("../firebase/firestore");
const inviteService = require("../services/inviteService");
const challengeService = require("../services/challengeService");

describe("challengeService", function () {
  let dbStub, inviteServiceStub;

  beforeEach(function () {
    dbStub = {
      queryDatabaseSingle: sinon.stub(db, "queryDatabaseSingle"),
      queryMultiple: sinon.stub(db, "queryMultiple"),
      addSingleDoc: sinon.stub(db, "addSingleDoc"),
      updateFieldArray: sinon.stub(db, "updateFieldArray"),
      removeFromFieldArray: sinon.stub(db, "removeFromFieldArray"),
      deleteSingleDoc: sinon.stub(db, "deleteSingleDoc"),
      batch: sinon.stub(db, "batch"),
      commitBatch: sinon.stub(db, "commitBatch"),
      incrementField: sinon.stub(db, "incrementField"),
      getRef: sinon.stub(db, "getRef"),
      getDeleteFromArray: sinon.stub(db, "getDeleteFromArray"),
    };

    inviteServiceStub = {
      createInvite: sinon.stub(inviteService, "createInvite"),
      declineInvite: sinon.stub(inviteService, "declineInvite"),
      deleteInvitesOnChallenge: sinon.stub(
        inviteService,
        "deleteInvitesOnChallenge",
      ),
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  describe("getChallenges", function () {
    it("should return challenges when user and challenges are found", async function () {
      const userId = "user123";
      const user = { challenges: ["challenge1", "challenge2"] };
      const challenges = [{ id: "challenge1" }, { id: "challenge2" }];

      dbStub.queryDatabaseSingle.resolves({ success: true, data: user });
      dbStub.queryMultiple.resolves({ success: true, data: challenges });

      const result = await challengeService.getChallenges(userId);
      expect(result).to.deep.equal({ success: true, data: challenges });
    });

    it("should return an error if user is not found", async function () {
      const userId = "user123";

      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "User not found",
      });

      const result = await challengeService.getChallenges(userId);
      expect(result).to.deep.equal({ success: false, error: "User not found" });
    });

    it("should return an error if challenges are not found", async function () {
      const userId = "user123";
      const user = { challenges: ["challenge1", "challenge2"] };

      dbStub.queryDatabaseSingle.resolves({ success: true, data: user });
      dbStub.queryMultiple.resolves({
        success: false,
        error: "Challenges not found",
      });

      const result = await challengeService.getChallenges(userId);
      expect(result).to.deep.equal({
        success: false,
        error: "Challenges not found",
      });
    });
  });

  describe("createChallenge", function () {
    it("should create a challenge and send invites successfully", async function () {
      const userId = "user123";
      const data = {
        goalId: "goal123",
        invitees: ["user456", "user789"],
      };
      const challengeId = "challenge123";
      const inviterName = "John Doe";
      const goalTitle = "Goal Title";

      dbStub.addSingleDoc.resolves({ success: true, id: challengeId });
      dbStub.updateFieldArray.resolves({ success: true });
      dbStub.queryDatabaseSingle
        .onFirstCall()
        .resolves({ success: true, data: { name: inviterName } })
        .onSecondCall()
        .resolves({ success: true, data: { title: goalTitle } });
      inviteServiceStub.createInvite.resolves({ success: true });

      const result = await challengeService.createChallenge(userId, data);
      expect(result).to.deep.equal({
        success: true,
        data: { id: challengeId },
      });
    });

    it("should return an error if challenge creation fails", async function () {
      const userId = "user123";
      const data = { invitees: [] };

      dbStub.addSingleDoc.resolves({
        success: false,
        error: "Failed to create challenge",
      });

      const result = await challengeService.createChallenge(userId, data);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to create challenge",
      });
    });

    it("should return an error if invite creation fails", async function () {
      const userId = "user123";
      const data = {
        goalId: "goal123",
        invitees: ["user456"],
      };
      const challengeId = "challenge123";
      const inviterName = "John Doe";
      const goalTitle = "Goal Title";

      dbStub.addSingleDoc.resolves({ success: true, id: challengeId });
      dbStub.updateFieldArray.resolves({ success: true });
      dbStub.queryDatabaseSingle
        .onFirstCall()
        .resolves({ success: true, data: { name: inviterName } })
        .onSecondCall()
        .resolves({ success: true, data: { title: goalTitle } });
      inviteServiceStub.createInvite.resolves({
        success: false,
        error: "Failed to create invite",
      });

      const result = await challengeService.createChallenge(userId, data);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to create invite",
      });
    });

    it("should return an error if inviter user lookup fails", async function () {
      dbStub.addSingleDoc.resolves({ success: true, id: "challenge123" });
      dbStub.updateFieldArray.resolves({ success: true });
      dbStub.queryDatabaseSingle
        .onFirstCall()
        .resolves({ success: false, error: "User not found" });

      const result = await challengeService.createChallenge("user123", {
        goalId: "goal123",
        invitees: ["user456"],
      });

      expect(result).to.deep.equal({ success: false, error: "User not found" });
    });

    it("should return an error if goal title lookup fails", async function () {
      dbStub.addSingleDoc.resolves({ success: true, id: "challenge123" });
      dbStub.updateFieldArray.resolves({ success: true });
      dbStub.queryDatabaseSingle
        .onFirstCall()
        .resolves({ success: true, data: { name: "John" } });
      dbStub.queryDatabaseSingle
        .onSecondCall()
        .resolves({ success: false, error: "Goal not found" });

      const result = await challengeService.createChallenge("user123", {
        goalId: "goal123",
        invitees: ["user456"],
      });

      expect(result).to.deep.equal({ success: false, error: "Goal not found" });
    });

    it("should return an error if updating user's challenges array fails", async function () {
      dbStub.addSingleDoc.resolves({ success: true, id: "challenge123" });
      dbStub.updateFieldArray.resolves({
        success: false,
        error: "Update failed",
      });

      const result = await challengeService.createChallenge("user123", {
        goalId: "goal123",
        invitees: ["user456"],
      });

      expect(result).to.deep.equal({
        success: false,
        error: "Failed to update user challenges array",
      });
    });
  });

  describe("deleteChallenge", function () {
    it("should delete a challenge and update participants successfully", async function () {
      const userId = "user123";
      const challengeId = "challenge123";
      const participants = ["user123", "user456"];
      const goalId = "goal123";

      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { participants, goalId },
      });
      dbStub.batch.returns({
        update: sinon.stub(),
      });
      dbStub.commitBatch.resolves({ success: true });
      dbStub.deleteSingleDoc.resolves({ success: true });
      inviteServiceStub.declineInvite.resolves({ success: true });
      inviteServiceStub.deleteInvitesOnChallenge.resolves({ success: true });

      const result = await challengeService.deleteChallenge(
        userId,
        challengeId,
      );
      expect(result).to.deep.equal({ success: true });
    });

    it("should return an error if challenge is not found", async function () {
      const userId = "user123";
      const challengeId = "challenge123";

      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "Challenge not found",
      });

      const result = await challengeService.deleteChallenge(
        userId,
        challengeId,
      );
      expect(result).to.deep.equal({
        success: false,
        error: "Challenge not found",
      });
    });

    it("should return an error if batch commit fails", async function () {
      const userId = "user123";
      const challengeId = "challenge123";
      const participants = ["user123", "user456"];
      const goalId = "goal123";

      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { participants, goalId },
      });
      dbStub.batch.returns({
        update: sinon.stub(),
      });
      dbStub.commitBatch.resolves({
        success: false,
        error: "Batch commit failed",
      });

      const result = await challengeService.deleteChallenge(
        userId,
        challengeId,
      );
      expect(result).to.deep.equal({
        success: false,
        error: "Batch commit failed",
      });
    });

    it("should return an error if deleting the challenge document fails", async function () {
      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { participants: ["user123"], goalId: "goal123" },
      });
      const batch = { update: sinon.stub() };
      dbStub.batch.returns(batch);
      dbStub.commitBatch.resolves({ success: true });
      dbStub.deleteSingleDoc.resolves({
        success: false,
        error: "Delete failed",
      });

      const result = await challengeService.deleteChallenge(
        "user123",
        "challenge123",
      );

      expect(result).to.deep.equal({ success: false, error: "Delete failed" });
    });

    it("should return an error if deleting invites fails", async function () {
      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { participants: ["user123"], goalId: "goal123" },
      });
      const batch = { update: sinon.stub() };
      dbStub.batch.returns(batch);
      dbStub.commitBatch.resolves({ success: true });
      dbStub.deleteSingleDoc.resolves({ success: true });
      inviteServiceStub.deleteInvitesOnChallenge.resolves({
        success: false,
        error: "Invite cleanup failed",
      });

      const result = await challengeService.deleteChallenge(
        "user123",
        "challenge123",
      );

      expect(result).to.deep.equal({
        success: false,
        error: "Invite cleanup failed",
      });
    });
  });

  describe("addUserToChallenge", function () {
    it("should return error if adding challenge to user fails", async function () {
      dbStub.updateFieldArray
        .withArgs("challenges", "challenge123", "participants", "user456")
        .resolves({ success: true });
      dbStub.updateFieldArray
        .withArgs("users", "user456", "challenges", "challenge123")
        .resolves({ success: false, error: "User update fail" });

      const result = await challengeService.addUserToChallenge(
        "user456",
        "challenge123",
      );

      expect(result).to.deep.equal({
        success: false,
        error: "User update fail",
      });
    });
  });

  describe("removeUserFromChallenge", function () {
    it("should return error if removing challenge from user fails", async function () {
      dbStub.removeFromFieldArray
        .withArgs("challenges", "challenge123", "participants", "user456")
        .resolves({ success: true });
      dbStub.removeFromFieldArray
        .withArgs("users", "user456", "challenges", "challenge123")
        .resolves({ success: false, error: "Remove user failed" });

      const result = await challengeService.removeUserFromChallenge(
        "user456",
        "challenge123",
      );

      expect(result).to.deep.equal({
        success: false,
        error: "Remove user failed",
      });
    });
  });

  describe("incrementChallenge", function () {
    it("should return error if incrementing challenge fails", async function () {
      dbStub.incrementField.resolves({
        success: false,
        error: "Increment failed",
      });

      const result = await challengeService.incrementChallenge({
        challengeId: "challenge123",
        amount: 1,
      });

      expect(result).to.deep.equal({
        success: false,
        error: "Increment failed",
      });
    });
  });
});
