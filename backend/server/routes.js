const userService = require("../services/userService");

function addHeartbeatRoute(app) {
  app.get("/heartbeat", (req, res) => {
    res.send("Hello World!");
  });
}

function addGetUserInfo(app) {
  app.post("/userInfo", async (req, res) => {
    // const authResult = authService.authenticateToken(req.body.token);
    // if (!authResult.uid) {
    //   res.send(`Authentication failed! Error message: ${authResult.message}`);
    // }
    const result = await userService.getUserInfo(req.body.token); // TODO: Add authentication
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
