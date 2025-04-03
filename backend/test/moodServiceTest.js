const { expect } = require("chai");
const sinon = require("sinon");
const db = require("../firebase/firestore");
const moodService = require("../services/moodService");

describe("moodService", function () {
    let dbStub;

    beforeEach(function () {
        dbStub = {
            queryDatabaseSingle: sinon.stub(db, "queryDatabaseSingle"),
            queryMultiple: sinon.stub(db, "queryMultiple"),
            addSingleDoc: sinon.stub(db, "addSingleDoc"),
            updateFieldArray: sinon.stub(db, "updateFieldArray"),
            removeFromFieldArray: sinon.stub(db, "removeFromFieldArray"),
            deleteSingleDoc: sinon.stub(db, "deleteSingleDoc"),
            updateSingleDoc: sinon.stub(db, "updateSingleDoc"),
        };
    });

    afterEach(function () {
        sinon.restore();
    });

    describe("submitMood", function () {
        it("should submit a new mood entry successfully", async function () {
            const uid = "user123";
            const rating = 4;
            const note = "Feeling good";
            const date = "2025-04-02";
            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: [] } });
            dbStub.addSingleDoc.resolves({ success: true, id: "mood123" });
            dbStub.updateFieldArray.resolves({ success: true });

            const result = await moodService.submitMood(uid, rating, note, date);
            expect(result).to.deep.equal({ success: true, data: { id: "mood123" } });
        });

        it("should return an error for invalid rating", async function () {
            const result = await moodService.submitMood("user123", 6, "Note", "2025-04-02");
            expect(result).to.deep.equal({ success: false, error: "Valid mood rating (0-5) is required" });
        });

        it("should return an error for invalid date format", async function () {
            const result = await moodService.submitMood("user123", 4, "Note", "invalid-date");
            expect(result).to.deep.equal({ success: false, error: "Invalid date format" });
        });

        it("should update an existing mood entry for the same day", async function () {
            const uid = "user123";
            const rating = 3;
            const note = "Updated note";
            const date = "2025-04-02";
            const existingMood = { id: "mood123", date: "2025-04-02T00:00:00.000Z" };
            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: ["mood123"] } });
            dbStub.queryMultiple.resolves({ success: true, data: [existingMood] });
            dbStub.updateSingleDoc.resolves({ success: true });
            sinon.stub(moodService, "updateMood").resolves({ success: true });

            const result = await moodService.submitMood(uid, rating, note, date);
            expect(result).to.deep.equal({ success: true, data: { id: "mood123" } });
        });

        it("should return an error if adding a mood entry fails", async function () {
            const uid = "user123";
            const rating = 4;
            const note = "Feeling good";
            const date = "2025-04-02";
            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: [] } });
            dbStub.addSingleDoc.resolves({ success: false, error: "Failed to save mood entry" });

            const result = await moodService.submitMood(uid, rating, note, date);
            expect(result).to.deep.equal({ success: false, error: "Failed to save mood entry" });
        });
    });

    describe("getUserMoodEntries", function () {
        it("should return mood entries successfully", async function () {
            const uid = "user123";
            const moods = [{ id: "mood1", date: "2025-04-01" }, { id: "mood2", date: "2025-04-02" }];
            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: ["mood1", "mood2"] } });
            dbStub.queryMultiple.resolves({ success: true, data: moods });

            const result = await moodService.getUserMoodEntries(uid);
            expect(result).to.deep.equal({ success: true, data: { ratings: moods.reverse() } });
        });

        it("should return an error if user is not found", async function () {
            dbStub.queryDatabaseSingle.resolves({ success: false, error: "User not found" });

            const result = await moodService.getUserMoodEntries("user123");
            expect(result).to.deep.equal({ success: false, error: "User not found" });
        });

        it("should return an empty array if no moods are found", async function () {
            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: [] } });

            const result = await moodService.getUserMoodEntries("user123");
            expect(result).to.deep.equal({ success: true, data: { ratings: [] } });
        });
    });

    describe("deleteMood", function () {
        it("should delete a mood entry successfully", async function () {
            const uid = "user123";
            const date = "2025-04-02";
            const mood = { id: "mood123", date: "2025-04-02T00:00:00.000Z" };
            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: ["mood123"] } });
            dbStub.queryMultiple.resolves({ success: true, data: [mood] });
            dbStub.deleteSingleDoc.resolves({ success: true });
            dbStub.removeFromFieldArray.resolves({ success: true });

            const result = await moodService.deleteMood(uid, date);
            expect(result).to.deep.equal({ success: true });
        });

        it("should return an error if mood entry is not found", async function () {
            const uid = "user123";
            const date = "2025-04-02";
            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: [] } });

            const result = await moodService.deleteMood(uid, date);
            expect(result).to.deep.equal({ success: false, error: "No mood entries found for this user" });
        });

        it("should return an error if deleting mood fails", async function () {
            const uid = "user123";
            const date = "2025-04-02";
            const mood = { id: "mood123", date: "2025-04-02T00:00:00.000Z" };
            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: ["mood123"] } });
            dbStub.queryMultiple.resolves({ success: true, data: [mood] });
            dbStub.deleteSingleDoc.resolves({ success: false, error: "Failed to delete mood entry" });

            const result = await moodService.deleteMood(uid, date);
            expect(result).to.deep.equal({ success: false, error: "Failed to delete mood entry" });
        });
    });

    describe("updateMood", function () {
        it("should update a mood entry successfully", async function () {
            const uid = "user123";
            const date = "2025-04-02";
            const note = "Updated note";
            const rating = 5;
            const mood = { id: "mood123", date: "2025-04-02T00:00:00.000Z" };
            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: ["mood123"] } });
            dbStub.queryMultiple.resolves({ success: true, data: [mood] });
            dbStub.updateSingleDoc.resolves({ success: true });

            const result = await moodService.updateMood(uid, date, note, rating);
            expect(result).to.deep.equal({ success: true, data: { id: "mood123" } });
        });

        it("should return an error for invalid rating", async function () {
            const mood = { id: "mood123", date: "2025-04-02T00:00:00.000Z" };

            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: ["mood123"] } });
            dbStub.queryMultiple.resolves({ success: true, data: [mood] });
            dbStub.updateSingleDoc.resolves({ success: true });

            const result = await moodService.updateMood("user123", "2025-04-02", "Note", 6);
            expect(result).to.deep.equal({ success: false, error: "Invalid rating provided. Must be an integer between 0 and 5." });
        });

        it("should return an error if mood entry is not found", async function () {
            const uid = "user123";
            const date = "2025-04-02";
            const mood = { id: "mood123", date: "2024-04-02T00:00:00.000Z" };

            dbStub.queryDatabaseSingle.resolves({ success: true, data: { moods: ["mood123"] } });
            dbStub.queryMultiple.resolves({ success: true, data: [mood] });
            dbStub.updateSingleDoc.resolves({ success: true });

            const result = await moodService.updateMood(uid, date, "Note", 4);
            expect(result).to.deep.equal({ success: false, error: "Mood entry not found for the specified date" });
        });
    });
});