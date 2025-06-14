const userService = require("../services/userService");
const aiService = require("../services/aiService");
const taskService = require("../services/taskService");
const goalService = require("../services/goalService");
const authService = require("../services/authService");
const postService = require("../services/postService");
const commentService = require("../services/commentService");
const challengeService = require("../services/challengeService");
const inviteService = require("../services/inviteService");
const moodService = require("../services/moodService");

function addHeartbeatRoute(app) {
  app.get("/heartbeat", (req, res) => {
    res.send("Hello World!");
  });

  app.post("/test", (req, res) => {
    res.json({
      success: true,
      message: "Test endpoint working",
    });
  });
}

function addGetUserInfo(app) {
  app.post("/userInfo", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const result = await userService.getUserInfo(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.message || "Failed to fetch user information",
        });
      }
    } catch (err) {
      console.error("Error in getUserInfo endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addFriendConnection(app) {
  app.post("/addFriendConnection", async (req, res) => {
    if (await userService.addFriendConnection(req.body.uid1, req.body.uid2))
      res.sendStatus(200);
    else res.sendStatus(500);
  });
}

function addGetFriendRecommendation(app) {
  app.post("/getFriendRecommendation", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }
      const result = await userService.getFriendRecommendations(req.body.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.message || "Failed to search for user",
        });
      }
    } catch (err) {
      console.error("Error in getFriendRecommendation endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetUserProfile(app) {
  app.post("/getUserProfile", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const userResult = await userService.getUserInfo(req.body.userId);
      if (!userResult.success) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const taskHistoryResult = await taskService.getTaskHistory(
        req.body.userId,
      );

      const currentUserResult = await userService.getUserInfo(authResult.uid);
      const isFriend =
        currentUserResult.success &&
        currentUserResult.data.friends?.includes(req.body.userId);

      return res.status(200).json({
        success: true,
        data: {
          ...userResult.data,
          isFriend,
          taskHistory: taskHistoryResult.success
            ? taskHistoryResult.data
            : null,
        },
      });
    } catch (err) {
      console.error("Error in getUserProfile endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetFriends(app) {
  app.post("/getFriends", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await userService.getFriends(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.message || "Failed to fetch friends",
        });
      }
    } catch (err) {
      console.error("Error in getFriends endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addSearchUser(app) {
  app.post("/searchUser", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await userService.searchUser(req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.message || "Failed to search for user",
        });
      }
    } catch (err) {
      console.error("Error in searchUser endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addCreateTask(app) {
  app.post("/createTask", async (req, res) => {
    try {
      if (!req.body.task) {
        return res
          .status(400)
          .json({ success: false, error: "Task data is required" });
      }

      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.createTask(
        authResult.uid,
        req.body.task,
        req.body.goalId ?? null,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Task created successfully",
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create task",
        });
      }
    } catch (err) {
      console.error("Error in createTask endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addDeleteTask(app) {
  app.post("/deleteTask", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.deleteTask(
        authResult.uid,
        req.body.taskId,
        req.body.goalId ?? null,
      );
      if (result.success) {
        return res
          .status(200)
          .json({ success: true, message: "Task deleted successfully" });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to delete task",
        });
      }
    } catch (err) {
      console.error("Error in deleteTask endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addEditTask(app) {
  app.post("/editTask", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.editTask(
        authResult.uid,
        req.body.taskId,
        req.body.fieldToChange,
        req.body.newValue,
      );

      if (result.success) {
        return res
          .status(200)
          .json({ success: true, message: "Task updated successfully" });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to update task",
        });
      }
    } catch (err) {
      console.error("Error in editTask endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addToggleTaskCompletion(app) {
  app.post("/toggleTaskCompletion", async (req, res) => {
    try {
      if (!req.body.taskId) {
        return res
          .status(400)
          .json({ success: false, error: "Task ID is required" });
      }

      if (req.body.completed === undefined) {
        return res
          .status(400)
          .json({ success: false, error: "Completed status is required" });
      }

      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      console.log(
        `Processing toggle task completion. UID: ${authResult.uid}, TaskID: ${req.body.taskId}, Completed: ${req.body.completed}`,
      );

      try {
        const result = await taskService.toggleTaskCompletion(
          authResult.uid,
          req.body.taskId,
          req.body.completed,
        );

        console.log("Toggle task completion result:", result);

        if (result.success) {
          const freshTaskDataPromise = taskService.getUserTasks(authResult.uid);
          const taskHistoryPromise = taskService.getTaskHistory(authResult.uid);

          const [freshTaskData, freshTaskHistory] = await Promise.all([
            freshTaskDataPromise,
            taskHistoryPromise,
          ]);

          return res.status(200).json({
            success: true,
            message: req.body.completed
              ? "Task marked as complete"
              : "Task marked as incomplete",
            data: {
              tasks: freshTaskData.success ? freshTaskData.data : [],
              recentActivity: freshTaskHistory.success
                ? {
                    completions:
                      freshTaskHistory.data.completions?.slice(0, 5) || [],
                    streaks: freshTaskHistory.data.streaks,
                  }
                : null,
            },
          });
        } else {
          return res.status(500).json({
            success: false,
            error: result.error || "Failed to update task completion",
          });
        }
      } catch (serviceErr) {
        console.error("Service error in toggleTaskCompletion:", serviceErr);

        return res.status(500).json({
          success: false,
          error:
            typeof serviceErr === "object"
              ? serviceErr.message || "Service error occurred"
              : String(serviceErr),
        });
      }
    } catch (err) {
      console.error("Error in toggleTaskCompletion endpoint:", err);

      return res.status(500).json({
        success: false,
        error:
          typeof err === "object"
            ? err.message || "Server error occurred"
            : String(err),
      });
    }
  });
}

function addGetUserTasks(app) {
  app.post("/getUserTasks", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.getUserTasks(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch tasks",
        });
      }
    } catch (err) {
      console.error("Error in getUserTasks endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetGoalTasks(app) {
  app.post("/getGoalTasks", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.getGoalTasks(req.body.goalId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch goal tasks",
        });
      }
    } catch (err) {
      console.error("Error in getGoalTasks endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addCreateGoal(app) {
  app.post("/createGoal", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await goalService.createGoal(
        authResult.uid,
        req.body.goal,
        req.body.invitees,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: "Goal created successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create goal",
        });
      }
    } catch (err) {
      console.error("Error in createGoal endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addDeleteGoal(app) {
  app.post("/deleteGoal", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await goalService.deleteGoal(
        authResult.uid,
        req.body.goalId,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Goal deleted successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to delete goal",
        });
      }
    } catch (err) {
      console.error("Error in deleteGoal endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addEditGoal(app) {
  app.post("/editGoal", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await goalService.editGoal(
        authResult.uid,
        req.body.goalId,
        req.body.fieldToChange,
        req.body.newValue,
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Goal updated successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to update goal",
        });
      }
    } catch (err) {
      console.error("Error in editGoal endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetUserGoals(app) {
  app.post("/getUsergoals", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await goalService.getUserGoals(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch user goals",
        });
      }
    } catch (err) {
      console.error("Error in getUserGoals endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetTaskHistory(app) {
  app.post("/getTaskHistory", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.getTaskHistory(
        authResult.uid,
        req.body.startDate,
        req.body.endDate,
        req.body.lastDoc,
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch task history",
        });
      }
    } catch (err) {
      console.error("Error in getTaskHistory endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addSubmitHappinessRating(app) {
  app.post("/submitHappinessRating", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const { taskId, rating, date } = req.body;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
      }

      if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({
          success: false,
          error: "Valid happiness rating (1-5) is required",
        });
      }

      const parsedDate = date ? new Date(date) : new Date();
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format",
        });
      }

      const result = await taskService.submitHappinessRating(
        authResult.uid,
        taskId,
        rating,
        parsedDate.toISOString(),
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to submit happiness rating",
        });
      }
    } catch (err) {
      console.error("Error in submitHappinessRating endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addSubmitMood(app) {
  app.post("/submitMood", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const { rating, note, date } = req.body;
      const result = await moodService.submitMood(
        authResult.uid,
        rating,
        note,
        date,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (err) {
      console.error("Error in submitMood endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetMoodData(app) {
  app.post("/getMoodData", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const result = await moodService.getUserMoodEntries(authResult.uid);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (err) {
      console.error("Error in getMoodData endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetHappinessData(app) {
  app.post("/getHappinessData", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const { startDate, endDate } = req.body;

      const result = await taskService.getHappinessData(
        authResult.uid,
        startDate,
        endDate,
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch happiness data",
        });
      }
    } catch (err) {
      console.error("Error in getHappinessData endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addCreatePost(app) {
  app.post("/createPost", async (req, res) => {
    try {
      if (!req.body.post) {
        return res
          .status(400)
          .json({ success: false, error: "Post data is required" });
      }

      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await postService.createPost(
        authResult.uid,
        req.body.post,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Post created successfully",
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create post",
        });
      }
    } catch (err) {
      console.error("Error in createPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetUserWithFriendPosts(app) {
  app.post("/getUserWithFriendPosts", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await postService.getUserWithFriendPosts(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch user posts",
        });
      }
    } catch (err) {
      console.error("Error in getUserWithFriendPosts endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addEditPost(app) {
  app.post("/editPost", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await postService.editPost(
        authResult.uid,
        req.body.postId,
        req.body.fieldToChange,
        req.body.newValue,
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Post updated successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to update post",
        });
      }
    } catch (err) {
      console.error("Error in editPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addDeletePost(app) {
  app.post("/deletePost", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await postService.deletePost(
        authResult.uid,
        req.body.postId,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Post deleted successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to delete post",
        });
      }
    } catch (err) {
      console.error("Error in deletePost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetCommentsOnPost(app) {
  app.post("/getCommentsOnPost", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await commentService.getCommentsOnPost(req.body.postId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch comments on post",
        });
      }
    } catch (err) {
      console.error("Error in getCommentsOnPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addCommentOnPost(app) {
  app.post("/commentOnPost", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await commentService.createComment(
        authResult.uid,
        req.body.data,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: "Comment added successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create comment",
        });
      }
    } catch (err) {
      console.error("Error in commentOnPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addDeleteCommentOnPost(app) {
  app.post("/deleteCommentOnPost", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await commentService.deleteComment(req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Comment deleted successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to delete comment",
        });
      }
    } catch (err) {
      console.error("Error in deleteCommentOnPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addLikePost(app) {
  app.post("/likePost", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await postService.likePost(
        authResult.uid,
        req.body.postId,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Post liked successfully",
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to like post",
        });
      }
    } catch (err) {
      console.error("Error in likePost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addCreateChallenge(app) {
  app.post("/createChallenge", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.createChallenge(
        authResult.uid,
        req.body.data,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Challenge created successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create challenge",
        });
      }
    } catch (err) {
      console.error("Error in createChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addDeleteChallenge(app) {
  app.post("/deleteChallenge", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.deleteChallenge(
        authResult.uid,
        req.body.challengeId,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Challenge deleted successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to delete challenge",
        });
      }
    } catch (err) {
      console.error("Error in deleteChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addAddUserToChallenge(app) {
  app.post("/addUserToChallenge", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.addUserToChallenge(
        authResult.uid,
        req.body.challengeId,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "User added successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to add user",
        });
      }
    } catch (err) {
      console.error("Error in addUserToChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addRemoveUserFromChallenge(app) {
  app.post("/removeUserFromChallenge", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.removeUserFromChallenge(
        authResult.uid,
        req.body.challengeId,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "User removed successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to remove user",
        });
      }
    } catch (err) {
      console.error("Error in removeUserFromChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addIncrementChallenge(app) {
  app.post("/incrementChallenge", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.incrementChallenge(req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: `Challenge incremented by ${req.body.data.amount}`,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to increment challenge",
        });
      }
    } catch (err) {
      console.error("Error in incrementChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetChallengeInfo(app) {
  app.post("/getChallengeInfo", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.getChallengeInfo(
        req.body.challengeId,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to get challenge info",
        });
      }
    } catch (err) {
      console.error("Error in getChallengeInfo endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetChallenges(app) {
  app.post("/getChallenges", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.getChallenges(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to get challenges",
        });
      }
    } catch (err) {
      console.error("Error in getChallenges endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addCreateInvite(app) {
  app.post("/createInvite", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await inviteService.createInvite(
        authResult.uid,
        req.body.data,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create the invite",
        });
      }
    } catch (err) {
      console.error("Error in addCreateInvite endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addAcceptInvite(app) {
  app.post("/acceptInvite", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await inviteService.acceptInvite(
        authResult.uid,
        req.body.data,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to accept the invite",
        });
      }
    } catch (err) {
      console.error("Error in addAcceptInvite endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addDeclineInvite(app) {
  app.post("/declineInvite", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await inviteService.declineInvite(req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to decline the invite",
        });
      }
    } catch (err) {
      console.error("Error in declineInvite endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetUserInvites(app) {
  app.post("/getUserInvites", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await inviteService.getUserInvites(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch user invites",
        });
      }
    } catch (err) {
      console.error("Error in getUserInvites endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addResetRecurringTasks(app) {
  app.post("/resetRecurringTasks", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      console.log(`Manual trigger of task reset by user: ${authResult.uid}`);

      const result = await taskService.resetRecurringTasks();

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: `Task reset completed: ${result.message}`,
          data: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to reset recurring tasks",
        });
      }
    } catch (err) {
      console.error("Error in resetRecurringTasks endpoint:", err);
      return res.status(500).json({
        success: false,
        error:
          typeof err === "object"
            ? err.message || "Server error occurred"
            : String(err),
      });
    }
  });
}

function addGetAITip(app) {
  app.post("/getAITip", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await aiService.getWellnessTip(authResult.uid);
      console.log("Wellness tip result:", result);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to get AI Tip for user",
        });
      }
    } catch (err) {
      console.error("Error in getAITip endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetAITaskRecommendation(app) {
  app.post("/getAITaskRecommendation", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await aiService.AITaskRecommendation(authResult.uid);
      console.log("AI recommendation result:", result);

      if (result.success) {
        console.log("Sending AI suggestion to frontend:", result.message);
        return res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to get AI recommendation for user",
        });
      }
    } catch (err) {
      console.error("Error in getAIRecommendation endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addFollowUser(app) {
  app.post("/followUser", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await userService.followUser(
        authResult.uid,
        req.body.followee,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to follow user",
        });
      }
    } catch (err) {
      console.error("Error in followUser endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addUnfollowUser(app) {
  app.post("/unfollowUser", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await userService.unfollowUser(
        authResult.uid,
        req.body.followee,
      );
      if (result.success) {
        return res.status(200).json({
          success: true,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to unfollow user",
        });
      }
    } catch (err) {
      console.error("Error in unfollwUser endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetFollowers(app) {
  app.post("/getFollowers", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await userService.getFollowers(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to get followers",
        });
      }
    } catch (err) {
      console.error("Error in getFollowers endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addGetFollowing(app) {
  app.post("/getFollowing", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`,
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await userService.getFollowing(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to get following",
        });
      }
    } catch (err) {
      console.error("Error in getFollowing endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addDeleteMood(app) {
  app.post("/deleteMood", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const { date } = req.body;
      if (!date) {
        return res.status(400).json({
          success: false,
          error: "Date is required",
        });
      }

      const result = await moodService.deleteMood(authResult.uid, date);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Mood entry deleted successfully",
      });
    } catch (err) {
      console.error("Error in deleteMood endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addUpdateMood(app) {
  app.post("/updateMood", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const { date, note, rating } = req.body;
      if (!date) {
        return res.status(400).json({
          success: false,
          error: "Date is required",
        });
      }

      const result = await moodService.updateMood(
        authResult.uid,
        date,
        note,
        rating,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Mood entry updated successfully",
      });
    } catch (err) {
      console.error("Error in updateMood endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addAssociateTaskWithGoal(app) {
  app.post("/associateTaskWithGoal", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const { taskId, goalId } = req.body;
      if (!taskId || !goalId) {
        return res.status(400).json({
          success: false,
          error: "Task ID and Goal ID are required",
        });
      }

      const result = await taskService.associateTaskWithGoal(
        authResult.uid,
        taskId,
        goalId,
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || "Failed to associate task with goal",
        });
      }
    } catch (err) {
      console.error("Error in associateTaskWithGoal endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

function addUnassociateTaskFromGoal(app) {
  app.post("/unassociateTaskFromGoal", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`,
        });
      }

      const { taskId } = req.body;
      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
      }

      const result = await taskService.unassociateTaskFromGoal(
        authResult.uid,
        taskId,
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || "Failed to unassociate task from goal",
        });
      }
    } catch (err) {
      console.error("Error in unassociateTaskFromGoal endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred",
      });
    }
  });
}

module.exports = function injectRoutes(app) {
  addHeartbeatRoute(app);

  addGetUserInfo(app);
  addFriendConnection(app);
  addGetFriendRecommendation(app);
  addGetUserProfile(app);
  addGetFriends(app);
  addSearchUser(app);

  /**
   * FR6 - Task.Creation - The system shall allow users to create wellness tasks by
    providing a title, description, and frequency (e.g., daily, weekly). It shall
    validate the inputs and save the task details to the database.
  */
  addCreateTask(app);
  /**
   * FR8 - Task.Delete - The system shall allow users to delete wellness tasks. It shall
    display a confirmation prompt to prevent accidental deletion and remove
    the task from the database upon confirmation.
  */
  addDeleteTask(app);
  /**
   * FR7 - Task.Edit - The system shall allow users to edit existing tasks by modifying
    the title, description, or frequency. The changes shall be validated and
    updated in the database upon user confirmation.
  */
  addEditTask(app);
  addToggleTaskCompletion(app);
  addGetUserTasks(app);
  addGetGoalTasks(app);
  /**
   * FR9 - Task.History - The system shall track and maintain a record of task
    completion history for each user. Users shall be able to view their task
    history through the user interface.
  */
  addGetTaskHistory(app);
  addAssociateTaskWithGoal(app);
  addUnassociateTaskFromGoal(app);

  /**
   * FR21 - Friend.Challenges - The system shall enable users to create and participate
    in group challenges, tracking collective progress and displaying updates to
    all participants.
  */
  /**
   * FR11 - Goal.Creation - The system shall allow users to create personal goals by
    providing a title, description, and deadline. It shall validate the inputs and
    save the goal to the database for tracking.
  */
  addCreateGoal(app);
  /**
   * FR13 - Goal.Delete - The system shall allow users to delete personal goals. A
    confirmation prompt shall be displayed before the goal is removed from the
    database.
  */
  addDeleteGoal(app);
  /**
   * FR12 - Goal.Edit - The system shall enable users to edit existing goals. It shall
    validate the modifications and update the goal details in the database.
  */
  addEditGoal(app);
  addGetUserGoals(app);

  /** 
   * FR10 - Task.Happiness - The system shall prompt users daily to rate their happiness
    on a scale. The ratings shall be validated, stored in the database, and used
    for generating insights.
  */
  addSubmitHappinessRating(app);
  addGetHappinessData(app);

  addSubmitMood(app);
  addGetMoodData(app);
  addDeleteMood(app);
  addUpdateMood(app);

  /**
   * FR22 - Community.Feed - The system shall provide a community feed where users
    can share completed goals, motivational updates, or optional journal
    entries. Shared content shall adhere to the user’s privacy settings.
  */
  addCreatePost(app);
  addGetUserWithFriendPosts(app);
  addEditPost(app);
  addDeletePost(app);
  addLikePost(app);

  /**
   * FR22 - Community.Feed - The system shall provide a community feed where users
    can share completed goals, motivational updates, or optional journal
    entries. Shared content shall adhere to the user’s privacy settings.
  */
  addGetCommentsOnPost(app);
  addCommentOnPost(app);
  addDeleteCommentOnPost(app);

  addCreateChallenge(app);
  addDeleteChallenge(app);
  addAddUserToChallenge(app);
  addRemoveUserFromChallenge(app);
  addIncrementChallenge(app);
  addGetChallengeInfo(app);
  addGetChallenges(app);

  /**
   * FR20 - Friend.Invite - The system shall allow users to invite friends to join the
    platform. Invitations shall be sent securely using usernames or email
    addresses.
  */
  addCreateInvite(app);
  addAcceptInvite(app);
  addDeclineInvite(app);
  addGetUserInvites(app);

  addResetRecurringTasks(app);

  /**
   * FR19 - AI.DailyTips - The system shall generate personalized daily tips for users,
    based on their wellness trends and past activity data, to encourage
    continued engagement and improvement.
  */
  addGetAITip(app);
  /**
   * FR18 - AI.Suggest - The system shall analyze the user’s completed tasks and
    happiness ratings to identify patterns. It shall provide task suggestions that
    align with activities contributing to higher happiness scores.
  */
  addGetAITaskRecommendation(app);

  addFollowUser(app);
  addUnfollowUser(app);
  /**
   * FR23 - Social.Web: The system shall enable users to access their friends' profiles
    and view lists of followers and followees.
   * FR20 - Friend.Invite - The system shall allow users to invite friends to join the
    platform. Invitations shall be sent securely using usernames or email
    addresses.
  */
  addGetFollowers(app);
  addGetFollowing(app);
};
