const userService = require("../services/userService");
const taskService = require("../services/taskService");
const goalService = require("../services/goalService");
const authService = require("../services/authService");
const postService = require("../services/postService");
const commentService = require("../services/commentService");
const challengeService = require("../services/challengeService");
const inviteService = require("../services/inviteService");

function addHeartbeatRoute(app) {
  app.get("/heartbeat", (req, res) => {
    res.send("Hello World!");
  });
}

function addGetUserInfo(app) {
  app.post("/userInfo", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`
        });
      }

      const result = await userService.getUserInfo(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.message || "Failed to fetch user information"
        });
      }
    } catch (err) {
      console.error("Error in getUserInfo endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
      });
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

function addGetUserProfile(app) {
  app.post("/getUserProfile", async (req, res) => {
    try {
      const authResult = await authService.authenticateToken(req.body.token);
      if (!authResult.uid) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: ${authResult.message || "Invalid token"}`
        });
      }

      // Get user info
      const userResult = await userService.getUserInfo(req.body.userId);
      if (!userResult.success) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      // Get task history
      const taskHistoryResult = await taskService.getTaskHistory(req.body.userId);
      
      // Check if users are friends
      const currentUserResult = await userService.getUserInfo(authResult.uid);
      const isFriend = currentUserResult.success && 
        currentUserResult.data.friends?.includes(req.body.userId);

      return res.status(200).json({
        success: true,
        data: {
          ...userResult.data,
          isFriend,
          taskHistory: taskHistoryResult.success ? taskHistoryResult.data : null
        }
      });
    } catch (err) {
      console.error("Error in getUserProfile endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
      });
    }
  });
}

function addCreateTask(app) {
  app.post("/createTask", async (req, res) => {
    try {
      if (!req.body.task) {
        return res.status(400).json({ success: false, error: "Task data is required" });
      }

      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        // Debug header bypass
        authResult.uid = req.body.token;
      }

      const result = await taskService.createTask(authResult.uid, req.body.task, req.body.goalId ?? null);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Task created successfully",
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create task"
        });
      }
    } catch (err) {
      console.error("Error in createTask endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.deleteTask(authResult.uid, req.body.taskId, req.body.goalId ?? null);
      if (result.success) {
        return res.status(200).json({ success: true, message: "Task deleted successfully" });
      } else {
        return res.status(500).json({ success: false, error: result.error || "Failed to delete task" });
      }
    } catch (err) {
      console.error("Error in deleteTask endpoint:", err);
      return res.status(500).json({ success: false, error: err.message || "Server error occurred" });
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
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
        return res.status(200).json({ success: true, message: "Task updated successfully" });
      } else {
        return res.status(500).json({ success: false, error: result.error || "Failed to update task" });
      }
    } catch (err) {
      console.error("Error in editTask endpoint:", err);
      return res.status(500).json({ success: false, error: err.message || "Server error occurred" });
    }
  });
}

function addToggleTaskCompletion(app) {
  app.post("/toggleTaskCompletion", async (req, res) => {
    try {
      // Validate required fields
      if (!req.body.taskId) {
        return res.status(400).json({ success: false, error: "Task ID is required" });
      }

      // Ensure completed status is provided
      if (req.body.completed === undefined) {
        return res.status(400).json({ success: false, error: "Completed status is required" });
      }

      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      console.log(`Processing toggle task completion. UID: ${authResult.uid}, TaskID: ${req.body.taskId}, Completed: ${req.body.completed}`);

      try {
        const result = await taskService.toggleTaskCompletion(
          authResult.uid,
          req.body.taskId,
          req.body.completed
        );

        console.log(`Toggle task completion result:`, result);

        if (result.success) {
          // Get fresh task data and include it in the response for immediate UI update
          // This avoids stale data in the UI without requiring additional API calls
          const freshTaskDataPromise = taskService.getUserTasks(authResult.uid);
          const taskHistoryPromise = taskService.getTaskHistory(authResult.uid);
          
          const [freshTaskData, freshTaskHistory] = await Promise.all([
            freshTaskDataPromise,
            taskHistoryPromise
          ]);
          
          return res.status(200).json({
            success: true,
            message: req.body.completed ? "Task marked as complete" : "Task marked as incomplete",
            data: {
              tasks: freshTaskData.success ? freshTaskData.data : [],
              recentActivity: freshTaskHistory.success ? {
                completions: freshTaskHistory.data.completions?.slice(0, 5) || [],
                streaks: freshTaskHistory.data.streaks
              } : null
            }
          });
        } else {
          // Always return JSON format
          return res.status(500).json({
            success: false,
            error: result.error || "Failed to update task completion"
          });
        }
      } catch (serviceErr) {
        console.error("Service error in toggleTaskCompletion:", serviceErr);
        // Ensure we send a properly formatted JSON response
        return res.status(500).json({
          success: false,
          error: typeof serviceErr === 'object' ?
            (serviceErr.message || "Service error occurred") :
            String(serviceErr)
        });
      }
    } catch (err) {
      console.error("Error in toggleTaskCompletion endpoint:", err);
      // Ensure all errors are converted to JSON responses
      return res.status(500).json({
        success: false,
        error: typeof err === 'object' ?
          (err.message || "Server error occurred") :
          String(err)
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.getUserTasks(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch tasks"
        });
      }
    } catch (err) {
      console.error("Error in getUserTasks endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.getGoalTasks(req.body.goalId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch goal tasks"
        });
      }
    } catch (err) {
      console.error("Error in getGoalTasks endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await goalService.createGoal(authResult.uid, req.body.goal);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: "Goal created successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create goal"
        });
      }
    } catch (err) {
      console.error("Error in createGoal endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await goalService.deleteGoal(authResult.uid, req.body.goalId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Goal deleted successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to delete goal"
        });
      }
    } catch (err) {
      console.error("Error in deleteGoal endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
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
        return res.status(200).json({
          success: true,
          message: "Goal updated successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to update goal"
        });
      }
    } catch (err) {
      console.error("Error in editGoal endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await goalService.getUserGoals(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch user goals"
        });
      }
    } catch (err) {
      console.error("Error in getUserGoals endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await taskService.getTaskHistory(
        authResult.uid,
        req.body.startDate,
        req.body.endDate,
        req.body.lastDoc
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch task history"
        });
      }
    } catch (err) {
      console.error("Error in getTaskHistory endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
          error: `Authentication failed: ${authResult.message || "Invalid token"}`
        });
      }

      // Validate inputs
      const { taskId, rating, date } = req.body;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: "Task ID is required"
        });
      }

      if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({
          success: false,
          error: "Valid happiness rating (1-5) is required"
        });
      }

      const parsedDate = date ? new Date(date) : new Date();
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format"
        });
      }

      // Submit the happiness rating
      const result = await taskService.submitHappinessRating(
        authResult.uid,
        taskId,
        rating,
        parsedDate.toISOString()
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to submit happiness rating"
        });
      }
    } catch (err) {
      console.error("Error in submitHappinessRating endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
          error: `Authentication failed: ${authResult.message || "Invalid token"}`
        });
      }

      // Optional date filtering parameters
      const { startDate, endDate } = req.body;

      // Get happiness data
      const result = await taskService.getHappinessData(
        authResult.uid,
        startDate,
        endDate
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch happiness data"
        });
      }
    } catch (err) {
      console.error("Error in getHappinessData endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
      });
    }
  });
}

function addCreatePost(app) {
  app.post("/createPost", async (req, res) => {
    try {
      if (!req.body.post) {
        return res.status(400).json({ success: false, error: "Post data is required" });
      }

      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        // Debug header bypass
        authResult.uid = req.body.token;
      }

      const result = await postService.createPost(authResult.uid, req.body.post);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Post created successfully",
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create post"
        });
      }
    } catch (err) {
      console.error("Error in createPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
      });
    }
  });
}

function addGetUserPosts(app) {
  app.post("/getUserPosts", async (req, res) => {
    try {
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await postService.getUserPosts(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch user posts"
        });
      }
    } catch (err) {
      console.error("Error in getUserPosts endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await postService.editPost(
        authResult.uid,
        req.body.postId,
        req.body.fieldToChange,
        req.body.newValue
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Post updated successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to update post"
        });
      }
    } catch (err) {
      console.error("Error in editPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await postService.deletePost(authResult.uid, req.body.postId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Post deleted successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to delete post"
        });
      }
    } catch (err) {
      console.error("Error in deletePost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await commentService.getCommentsOnPost(req.body.postId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch comments on post"
        });
      }
    } catch (err) {
      console.error("Error in getCommentsOnPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await commentService.createComment(authResult.uid, req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          message: "Comment added successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create comment"
        });
      }
    } catch (err) {
      console.error("Error in commentOnPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await commentService.deleteComment(req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Comment deleted successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to delete comment"
        });
      }
    } catch (err) {
      console.error("Error in deleteCommentOnPost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await postService.likePost(authResult.uid, req.body.postId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Post liked successfully",
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to like post"
        });
      }
    } catch (err) {
      console.error("Error in likePost endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.createChallenge(authResult.uid, req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Challenge created successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create challenge"
        });
      }
    } catch (err) {
      console.error("Error in createChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.deleteChallenge(authResult.uid, req.body.challengeId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Challenge deleted successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to delete challenge"
        });
      }
    } catch (err) {
      console.error("Error in deleteChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.addUserToChallenge(authResult.uid, req.body.challengeId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "User added successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to add user"
        });
      }
    } catch (err) {
      console.error("Error in addUserToChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.removeUserFromChallenge(authResult.uid, req.body.challengeId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "User removed successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to remove user"
        });
      }
    } catch (err) {
      console.error("Error in removeUserFromChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.incrementChallenge(req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: `Challenge incremented by ${req.body.data.amount}`
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to increment challenge"
        });
      }
    } catch (err) {
      console.error("Error in incrementChallenge endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await challengeService.getChallengeInfo(req.body.challengeId);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to get challenge info"
        });
      }
    } catch (err) {
      console.error("Error in getChallengeInfo endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await inviteService.createInvite(authResult.uid, req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to create the invite"
        });
      }
    } catch (err) {
      console.error("Error in addCreateInvite endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await inviteService.acceptInvite(authResult.uid, req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to accept the invite"
        });
      }
    } catch (err) {
      console.error("Error in addAcceptInvite endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await inviteService.declineInvite(req.body.data);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to decline the invite"
        });
      }
    } catch (err) {
      console.error("Error in declineInvite endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
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
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }

      const result = await inviteService.getUserInvites(authResult.uid);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch user invites"
        });
      }
    } catch (err) {
      console.error("Error in getUserInvites endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Server error occurred"
      });
    }
  });
}

function addResetRecurringTasks(app) {
  app.post("/resetRecurringTasks", async (req, res) => {
    try {
      // Admin authentication check
      let authResult = {};
      if (!req.headers.debug) {
        authResult = await authService.authenticateToken(req.body.token);
        if (!authResult.uid) {
          return res.status(401).json({
            success: false,
            error: `Authentication failed! ${authResult.message || "Invalid token"}`
          });
        }
      } else {
        authResult.uid = req.body.token;
      }
      
      console.log(`Manual trigger of task reset by user: ${authResult.uid}`);
      
      // Call the reset function
      const result = await taskService.resetRecurringTasks();
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: `Task reset completed: ${result.message}`,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to reset recurring tasks"
        });
      }
    } catch (err) {
      console.error("Error in resetRecurringTasks endpoint:", err);
      return res.status(500).json({
        success: false,
        error: typeof err === 'object' ? (err.message || "Server error occurred") : String(err)
      });
    }
  });
}

module.exports = function injectRoutes(app) {
  addHeartbeatRoute(app);

  // Users
  addGetUserInfo(app);
  addFriendConnection(app);
  addGetFriendRecommendation(app);
  addGetUserProfile(app);

  // Tasks
  addCreateTask(app);
  addDeleteTask(app);
  addEditTask(app);
  addToggleTaskCompletion(app);
  addGetUserTasks(app);
  addGetGoalTasks(app);
  addGetTaskHistory(app);

  // Goals
  addCreateGoal(app);
  addDeleteGoal(app);
  addEditGoal(app);
  addGetUserGoals(app);

  // Happiness
  addSubmitHappinessRating(app);
  addGetHappinessData(app);

  // Posts
  addCreatePost(app);
  addGetUserPosts(app);
  addEditPost(app);
  addDeletePost(app);
  addLikePost(app);

  // Comments
  addCommentOnPost(app);
  addDeleteCommentOnPost(app);
  addGetCommentsOnPost(app);

  // Challenges
  addCreateChallenge(app);
  addDeleteChallenge(app);
  addAddUserToChallenge(app);
  addRemoveUserFromChallenge(app);
  addIncrementChallenge(app);
  addGetChallengeInfo(app);

  // Invites
  addCreateInvite(app);
  addAcceptInvite(app);
  addDeclineInvite(app);
  addGetUserInvites(app);

  // Reset Recurring Tasks
  addResetRecurringTasks(app);
}
