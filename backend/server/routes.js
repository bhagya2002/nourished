const userService = require("../services/userService");
const taskService = require("../services/taskService");
const goalService = require("../services/goalService");
const authService = require("../services/authService");

function addHeartbeatRoute(app) {
    app.get("/heartbeat", (req, res) => {
        res.send("Hello World!");
    });
}

function addGetUserInfo(app) {
    app.post("/userInfo", async (req, res) => {
        const authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
            return res.status(401).send(`Authentication failed: ${authResult.message}`);
        }
        const result = await userService.getUserInfo(authResult.uid);
        if (result.success) {
            res.send(result.data);
        } else {
            res.status(500).send(result.message);
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


function addCreateTask(app) {
    app.post("/createTask", async (req, res) => {
        let authResult = {};
        if (!req.headers.debug) {
            authResult = await authService.authenticateToken(req.body.token);
            if (!authResult.uid) {
                return res
                    .status(401)
                    .send(`Authentication failed! Error message: ${authResult.message}`);
            }
        } else {
            // Debug header bypass
            authResult.uid = req.body.token;
        }

        const result = await taskService.createTask(authResult.uid, req.body.task);
        if (result.success) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    });
}

function addDeleteTask(app) {
    app.post("/deleteTask", async (req, res) => {
        let authResult = {};
        if (!req.headers.debug) {
            authResult = await authService.authenticateToken(req.body.token);
            if (!authResult.uid) {
                return res
                    .status(401)
                    .send(`Authentication failed! Error message: ${authResult.message}`);
            }
        } else {
            authResult.uid = req.body.token;
        }

        const result = await taskService.deleteTask(authResult.uid, req.body.taskId);
        if (result.success) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    });
}

function addEditTask(app) {
    app.post("/editTask", async (req, res) => {
        let authResult = {};
        if (!req.headers.debug) {
            authResult = await authService.authenticateToken(req.body.token);
            if (!authResult.uid) {
                return res
                    .status(401)
                    .send(`Authentication failed! Error message: ${authResult.message}`);
            }
        } else {
            authResult.uid = req.body.token;
        }

        const result = await taskService.editTask(
            authResult.uid,
            req.body.taskId,
            req.body.fieldToChange,
            req.body.newValue
        );
        if (result.success) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    });
}

function addGetUserTasks(app) {
    app.post("/getUserTasks", async (req, res) => {
        let authResult = {};
        if (!req.headers.debug) {
            authResult = await authService.authenticateToken(req.body.token);
            if (!authResult.uid) {
                return res
                    .status(401)
                    .send(`Authentication failed! Error message: ${authResult.message}`);
            }
        } else {
            authResult.uid = req.body.token;
        }

        const result = await taskService.getUserTasks(authResult.uid);
        if (result.success) {
            res.send(result.data);
        } else {
            res.sendStatus(500);
        }
    });
}

function addGetGoalTasks(app) {
    app.post("/getGoalTasks", async (req, res) => {
        let authResult = {};
        if (!req.headers.debug) {
            authResult = await authService.authenticateToken(req.body.token);
            if (!authResult.uid) {
                return res
                    .status(401)
                    .send(`Authentication failed! Error message: ${authResult.message}`);
            }
        } else {
            authResult.uid = req.body.token;
        }

        const result = await taskService.getGoalTasks(req.body.goalId);
        if (result.success) {
            res.send(result.data);
        } else {
            res.sendStatus(500);
        }
    });
}


function addCreateGoal(app) {
    app.post("/createGoal", async (req, res) => {
        let authResult = {};
        if (!req.headers.debug) {
            authResult = await authService.authenticateToken(req.body.token);
            if (!authResult.uid) {
                return res
                    .status(401)
                    .send(`Authentication failed! Error message: ${authResult.message}`);
            }
        } else {
            authResult.uid = req.body.token;
        }

        const result = await goalService.createGoal(authResult.uid, req.body.goal);
        if (result.success) {
            res.status(200).send(result.data);
        } else {
            res.sendStatus(500);
        }
    });
}


function addDeleteGoal(app) {
    app.post("/deletegoal", async (req, res) => {
        let authResult = {};
        if (!req.headers.debug) {
            authResult = await authService.authenticateToken(req.body.token);
            if (!authResult.uid) {
                return res
                    .status(401)
                    .send(`Authentication failed! Error message: ${authResult.message}`);
            }
        } else {
            authResult.uid = req.body.token;
        }

        const result = await goalService.deleteGoal(
            authResult.uid,
            req.body.goalId
        );
        if (result.success) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    });
}

function addEditGoal(app) {
    app.post("/editgoal", async (req, res) => {
        let authResult = {};
        if (!req.headers.debug) {
            authResult = await authService.authenticateToken(req.body.token);
            if (!authResult.uid) {
                return res
                    .status(401)
                    .send(`Authentication failed! Error message: ${authResult.message}`);
            }
        } else {
            authResult.uid = req.body.token;
        }

        const result = await goalService.editGoal(
            authResult.uid,
            req.body.goalId,
            req.body.fieldToChange,
            req.body.newValue
        );
        if (result.success) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    });
}

function addGetUserGoals(app) {
    app.post("/getUsergoals", async (req, res) => {
        let authResult = {};
        if (!req.headers.debug) {
            authResult = await authService.authenticateToken(req.body.token);
            if (!authResult.uid) {
                return res
                    .status(401)
                    .send(`Authentication failed! Error message: ${authResult.message}`);
            }
        } else {
            authResult.uid = req.body.token;
        }

        const result = await goalService.getUserGoals(authResult.uid);
        if (result.success) {
            res.send(result.data);
        } else {
            res.sendStatus(500);
        }
    });
}

module.exports = function injectRoutes(app) {
    addHeartbeatRoute(app);

    // Users
    addGetUserInfo(app);
    addFriendConnection(app);
    addGetFriendRecommendation(app);

    // Tasks
    addCreateTask(app);
    addDeleteTask(app);
    addEditTask(app);
    addGetUserTasks(app);
    addGetGoalTasks(app);

    // Goals
    addCreateGoal(app);
    addDeleteGoal(app);
    addEditGoal(app);
    addGetUserGoals(app);
};
