const userService = require("../services/userService");

function addHeartbeatRoute(app) {
  app.get("/heartbeat", (req, res) => {
    res.send("Hello World!");
  });
}

function addGetUserInfo(app) {
  app.post("/userInfo", async (req, res) => {
    const authResult = authService.authenticateToken(req.body.token);
    if (!authResult.uid) {
      res.send(`Authentication failed! Error message: ${authResult.message}`);
    }
    const result = await userService.getUserInfo(authResult.uid); // TODO: Add authentication
    if (result.success) {
      res.send(result.data);
    } else {
      res.send(result.message);
    }
  });
}

function addFriendConnection(app) {
  app.post("/addFriendConnection", async (req, res) => {
    if (await userService.addFriendConnection(req.body.uid1, req.body.uid2)) res.sendStatus(200);
    else res.sendStatus(500);
  })
}

function addGetFriendRecommendation(app) {
  app.post("/getFriendRecommendation", async (req, res) => {
    res.send(await userService.getFriendRecommendations(req.body.uid));
  })
}

module.exports = function injectRoutes(app) {
  addHeartbeatRoute(app);
  addGetUserInfo(app);
  addFriendConnection(app);
  addGetFriendRecommendation(app);
};
