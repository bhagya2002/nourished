const { expect } = require("chai");
const sinon = require("sinon");
const { beforeEach, afterEach, describe, it } = require("mocha");
const db = require("../firebase/firestore");
const challengeService = require("../services/challengeService");
const goalService = require("../services/goalService");

describe("goalService", function () {
  let dbStub, challengeServiceStub;

  beforeEach(function () {
    dbStub = {
      addSingleDoc: sinon.stub(db, "addSingleDoc"),
      updateFieldArray: sinon.stub(db, "updateFieldArray"),
      updateField: sinon.stub(db, "updateField"),
      queryDatabaseSingle: sinon.stub(db, "queryDatabaseSingle"),
      queryMultiple: sinon.stub(db, "queryMultiple"),
      removeFromFieldArray: sinon.stub(db, "removeFromFieldArray"),
      deleteSingleDoc: sinon.stub(db, "deleteSingleDoc"),
      queryDatabase: sinon.stub(db, "queryDatabase"),
    };

    challengeServiceStub = {
      createChallenge: sinon.stub(challengeService, "createChallenge"),
      deleteChallenge: sinon.stub(challengeService, "deleteChallenge"),
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  describe("createGoal", function () {
    it("should create a goal and return its ID", async function () {
      const uid = "user123";
      const goal = { title: "New Goal" };
      dbStub.addSingleDoc.resolves({ success: true, id: "goal123" });
      dbStub.updateFieldArray.resolves({ success: true });

      const result = await goalService.createGoal(uid, goal, []);
      expect(result).to.deep.equal({
        success: true,
        data: { id: "goal123", challengeId: null },
      });
    });

    it("should create a goal and a challenge if isChallenge is true", async function () {
      const uid = "user123";
      const goal = { title: "New Goal", isChallenge: true };
      dbStub.addSingleDoc.resolves({ success: true, id: "goal123" });
      dbStub.updateFieldArray.resolves({ success: true });
      challengeServiceStub.createChallenge.resolves({
        success: true,
        data: { id: "challenge123" },
      });

      const result = await goalService.createGoal(uid, goal, ["user456"]);
      expect(result).to.deep.equal({
        success: true,
        data: { id: "goal123", challengeId: "challenge123" },
      });
    });

    it("should return an error if goal creation fails", async function () {
      const uid = "user123";
      const goal = { title: "New Goal" };
      dbStub.addSingleDoc.resolves({
        success: false,
        error: "Failed to create goal",
      });

      const result = await goalService.createGoal(uid, goal, []);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to create goal",
      });
    });

    it("should return an error if updating user goals fails", async function () {
      const uid = "user123";
      const goal = { title: "New Goal" };
      dbStub.addSingleDoc.resolves({ success: true, id: "goal123" });
      dbStub.updateFieldArray.resolves({
        success: false,
        error: "Failed to update user goals",
      });

      const result = await goalService.createGoal(uid, goal, []);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to update user goals",
      });
    });

    it("should return an error if challenge creation fails", async function () {
      const uid = "user123";
      const goal = { title: "New Goal", isChallenge: true };
      dbStub.addSingleDoc.resolves({ success: true, id: "goal123" });
      dbStub.updateFieldArray.resolves({ success: true });
      challengeServiceStub.createChallenge.resolves({
        success: false,
        error: "Failed to create challenge",
      });

      const result = await goalService.createGoal(uid, goal, ["user456"]);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to create challenge",
      });
    });
  });

  describe("editGoal", function () {
    it("should edit a goal successfully", async function () {
      const uid = "user123";
      const goalId = "goal123";
      const fieldToChange = "title";
      const newValue = "Updated Goal";
      dbStub.queryDatabaseSingle.resolves({ success: true });
      dbStub.updateField.resolves({ success: true });

      const result = await goalService.editGoal(
        uid,
        goalId,
        fieldToChange,
        newValue,
      );
      expect(result.success).to.be.true;
    });

    it("should return an error if user is not found", async function () {
      const uid = "user123";
      const goalId = "goal123";
      const fieldToChange = "title";
      const newValue = "Updated Goal";
      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "User not found",
      });

      const result = await goalService.editGoal(
        uid,
        goalId,
        fieldToChange,
        newValue,
      );
      expect(result).to.deep.equal({ success: false, error: "User not found" });
    });
  });

  describe("getUserGoals", function () {
    it("should return user goals successfully", async function () {
      const uid = "user123";
      const goals = [{ id: "goal1" }, { id: "goal2" }];
      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { goals: ["goal1", "goal2"] },
      });
      dbStub.queryMultiple.resolves({ success: true, data: goals });

      const result = await goalService.getUserGoals(uid);
      expect(result).to.deep.equal({ success: true, data: goals });
    });

    it("should return an error if user is not found", async function () {
      const uid = "user123";
      dbStub.queryDatabaseSingle.resolves({
        success: false,
        error: "User not found",
      });

      const result = await goalService.getUserGoals(uid);
      expect(result).to.deep.equal({ success: false, error: "User not found" });
    });
  });

  describe("deleteGoal", function () {
    it("should delete a goal and its challenges successfully", async function () {
      const uid = "user123";
      const goalId = "goal123";
      dbStub.removeFromFieldArray.resolves({ success: true });
      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { uid: "user123" },
      });
      dbStub.queryDatabase.resolves({
        success: true,
        data: [{ id: "challenge1" }],
      });
      challengeServiceStub.deleteChallenge.resolves({ success: true });
      dbStub.deleteSingleDoc.resolves({ success: true });

      const result = await goalService.deleteGoal(uid, goalId);
      expect(result).to.deep.equal({ success: true });
    });

    it("should return an error if goal deletion fails", async function () {
      const uid = "user123";
      const goalId = "goal123";
      dbStub.removeFromFieldArray.resolves({
        success: false,
        error: "Failed to delete goal",
      });

      const result = await goalService.deleteGoal(uid, goalId);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to delete goal",
      });
    });

    it("should return an error if challenge deletion fails", async function () {
      const uid = "user123";
      const goalId = "goal123";
      dbStub.removeFromFieldArray.resolves({ success: true });
      dbStub.queryDatabaseSingle.resolves({
        success: true,
        data: { uid: "user123" },
      });
      dbStub.queryDatabase.resolves({
        success: true,
        data: [{ id: "challenge1" }],
      });
      dbStub.deleteSingleDoc.resolves({ success: true });
      challengeServiceStub.deleteChallenge.resolves({
        success: false,
        error: "Failed to delete challenge",
      });

      const result = await goalService.deleteGoal(uid, goalId);
      expect(result).to.deep.equal({
        success: false,
        error: "Failed to delete challenge",
      });
    });
  });
});
