const { expect } = require("chai");
const sinon = require("sinon");
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
            deleteInvites: sinon.stub(inviteService, "deleteInvites"),
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

            dbStub.queryDatabaseSingle.resolves({ success: false, error: "User not found" });

            const result = await challengeService.getChallenges(userId);
            expect(result).to.deep.equal({ success: false, error: "User not found" });
        });

        it("should return an error if challenges are not found", async function () {
            const userId = "user123";
            const user = { challenges: ["challenge1", "challenge2"] };

            dbStub.queryDatabaseSingle.resolves({ success: true, data: user });
            dbStub.queryMultiple.resolves({ success: false, error: "Challenges not found" });

            const result = await challengeService.getChallenges(userId);
            expect(result).to.deep.equal({ success: false, error: "Challenges not found" });
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
            expect(result).to.deep.equal({ success: true, data: { id: challengeId } });
        });

        it("should return an error if challenge creation fails", async function () {
            const userId = "user123";
            const data = { invitees: [] };

            dbStub.addSingleDoc.resolves({ success: false, error: "Failed to create challenge" });

            const result = await challengeService.createChallenge(userId, data);
            expect(result).to.deep.equal({ success: false, error: "Failed to create challenge" });
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
            inviteServiceStub.createInvite.resolves({ success: false, error: "Failed to create invite" });

            const result = await challengeService.createChallenge(userId, data);
            expect(result).to.deep.equal({ success: false, error: "Failed to create invite" });
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
            inviteServiceStub.deleteInvites.resolves({ success: true });

            const result = await challengeService.deleteChallenge(userId, challengeId);
            expect(result).to.deep.equal({ success: true });
        });

        it("should return an error if challenge is not found", async function () {
            const userId = "user123";
            const challengeId = "challenge123";

            dbStub.queryDatabaseSingle.resolves({ success: false, error: "Challenge not found" });

            const result = await challengeService.deleteChallenge(userId, challengeId);
            expect(result).to.deep.equal({ success: false, error: "Challenge not found" });
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
            dbStub.commitBatch.resolves({ success: false, error: "Batch commit failed" });

            const result = await challengeService.deleteChallenge(userId, challengeId);
            expect(result).to.deep.equal({ success: false, error: "Batch commit failed" });
        });
    });

    // Additional tests for other functions like `addUserToChallenge`, `removeUserFromChallenge`, etc., can be written similarly.
});