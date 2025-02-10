const firestore = require("../firebase/firestore");

function addHeartbeatRoute(app) {
  app.get("/heartbeat", (req, res) => {
    res.send("Hello World!");
  });
}

function addGetUserInfo(app) {
  app.get("/userInfo/:token", async (req, res) => {
    const result = await firestore.getUserInfo(req.params.token); // TODO: Add authentication
    if (result.success) {
      res.send(result.data);
    } else {
      res.send(result.message);
    }
  });
}

module.exports = function injectRoutes(app) {
  addHeartbeatRoute(app);
  addGetUserInfo(app);
};
