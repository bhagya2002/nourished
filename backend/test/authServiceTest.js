const { expect } = require("chai");
const { beforeEach, afterEach, describe, it } = require("mocha");
const sinon = require("sinon");
const admin = require("../firebase/firebaseAdmin");
const authService = require("../services/authService");

describe("authService", function () {
  let verifyIdTokenStub;

  beforeEach(function () {
    // Stub the verifyIdToken method
    verifyIdTokenStub = sinon.stub(admin.auth(), "verifyIdToken");
  });

  afterEach(function () {
    sinon.restore();
  });

  describe("authenticateToken", function () {
    it("should return the UID when the token is valid", async function () {
      const idToken = "validToken";
      const decodedToken = { uid: "user123" };

      verifyIdTokenStub.resolves(decodedToken);

      const result = await authService.authenticateToken(idToken);
      expect(result).to.deep.equal({ uid: "user123" });
      expect(verifyIdTokenStub.calledOnceWith(idToken)).to.be.true;
    });

    it("should return an error message when the token is invalid", async function () {
      const idToken = "invalidToken";
      const errorMessage = "Invalid token";

      verifyIdTokenStub.rejects(new Error(errorMessage));

      const result = await authService.authenticateToken(idToken);
      expect(result).to.deep.equal({ message: errorMessage });
      expect(verifyIdTokenStub.calledOnceWith(idToken)).to.be.true;
    });

    it("should handle unexpected errors gracefully", async function () {
      const idToken = "unexpectedErrorToken";
      const unexpectedError = new Error("Unexpected error occurred");

      verifyIdTokenStub.rejects(unexpectedError);

      const result = await authService.authenticateToken(idToken);
      expect(result).to.deep.equal({ message: "Unexpected error occurred" });
      expect(verifyIdTokenStub.calledOnceWith(idToken)).to.be.true;
    });
  });
});
