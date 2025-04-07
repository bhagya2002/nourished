const db = require("../firebase/firestore");

const cacheStore = {
  tasks: {},
  history: {},
};

const CACHE_TTL = {
  TASKS: 10 * 1000,
  HISTORY: 30 * 1000,
};

function clearUserCaches(uid) {
  if (uid) {
    console.log(`Clearing all caches for user ${uid}`);
    Object.keys(cacheStore.tasks).forEach((key) => {
      if (key.includes(uid)) {
        delete cacheStore.tasks[key];
      }
    });
    Object.keys(cacheStore.history).forEach((key) => {
      if (key.includes(uid)) {
        delete cacheStore.history[key];
      }
    });
  }
}

function getHistoryCacheKey(uid, startDate, endDate) {
  return `${uid}:${startDate || ""}:${endDate || ""}`;
}

module.exports.createTask = async function createTask(uid, task, goalId) {
  try {
    task.uid = uid;

    const taskResult = await db.addSingleDoc("tasks", task);
    if (!taskResult.success) {
      return { success: false, error: taskResult.error };
    }

    const updateResult = await db.updateFieldArray(
      "users",
      uid,
      "tasks",
      taskResult.id,
    );
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }
    if (goalId) {
      const updateGoalResult = await db.updateFieldArray(
        "goals",
        goalId,
        "taskIds",
        taskResult.id,
      );
      if (!updateGoalResult.success) {
        return {
          success: false,
          error: updateGoalResult.error || "Failed to update goal with task ID",
        };
      }
      const goalResult = await db.queryDatabaseSingle(goalId, "goals");
      if (!goalResult.success) {
        return goalResult;
      }
      const goal = goalResult.data;
      const daysLeft = Math.ceil(
        (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24),
      );
      let totalTasks = 0;

      switch (task.frequency) {
        case "Daily":
          totalTasks = Math.ceil(daysLeft / 1);
          break;
        case "Weekly":
          totalTasks = Math.ceil(daysLeft / 7);
          break;
        case "Monthly":
          totalTasks = Math.ceil(daysLeft / 30);
          break;
        default:
          totalTasks = 0;
          break;
      }
      console.log(
        `Task ${taskResult.id} created for goal ${goalId}. Days left: ${daysLeft}. Total tasks: ${totalTasks}`,
      );
      await db.incrementField("goals", goalId, "totalTasks", totalTasks);
    }

    clearUserCaches(uid);

    return { success: true, data: { id: taskResult.id } };
  } catch (err) {
    return { success: false, error: err };
  }
};

module.exports.editTask = async function editTask(
  uid,
  taskId,
  fieldToChange,
  newValue,
) {
  const result = await db.queryDatabaseSingle(uid, "users");
  if (result.success) {
    if (fieldToChange === "frequency") {
      const taskResult = await db.queryDatabaseSingle(taskId, "tasks");
      if (!taskResult.success) {
        return taskResult;
      }
      const goalId = taskResult.data.goalId;
      if (goalId && newValue !== taskResult.data.frequency) {
        const goalResult = await db.queryDatabaseSingle(goalId, "goals");
        if (!goalResult.success) {
          return goalResult;
        }
        let daysLeft = Math.ceil(
          (new Date(goalResult.data.deadline) - new Date()) /
            (1000 * 60 * 60 * 24),
        );

        if (taskResult.data.completedAt) {
          const completedAt = new Date(taskResult.data.completedAt);
          const today = new Date();
          if (
            completedAt.getDate() === today.getDate() &&
            completedAt.getMonth() === today.getMonth() &&
            completedAt.getFullYear() === today.getFullYear()
          ) {
            daysLeft--;
          }
        }
        let totalTasksDecreased = 0;
        let totalTasksIncreased = 0;
        switch (taskResult.data.frequency) {
          case "Daily":
            totalTasksDecreased = Math.ceil(daysLeft / 1);
            break;
          case "Weekly":
            totalTasksDecreased = Math.ceil(daysLeft / 7);
            break;
          case "Monthly":
            totalTasksDecreased = Math.ceil(daysLeft / 30);
            break;
          default:
            totalTasksDecreased = 0;
            break;
        }
        switch (newValue) {
          case "Daily":
            totalTasksIncreased = Math.ceil(daysLeft / 1);
            break;
          case "Weekly":
            totalTasksIncreased = Math.ceil(daysLeft / 7);
            break;
          case "Monthly":
            totalTasksIncreased = Math.ceil(daysLeft / 30);
            break;
          default:
            totalTasksIncreased = 0;
            break;
        }
        console.log(
          `Task ${taskId} frequency changed from ${taskResult.data.frequency} to ${newValue}. Days left: ${daysLeft}. Total tasks decreased: ${totalTasksDecreased}. Total tasks increased: ${totalTasksIncreased}`,
        );
        await db.incrementField(
          "goals",
          goalId,
          "totalTasks",
          totalTasksIncreased - totalTasksDecreased,
        );
      }
    }

    const updateResult = await db.updateField(
      "tasks",
      taskId,
      fieldToChange,
      newValue,
    );

    clearUserCaches(uid);

    return updateResult;
  } else return result;
};

module.exports.getUserTasks = async function getUserTasks(uid) {
  console.time("getUserTasks");
  try {
    const cacheKey = `tasks_${uid}`;
    if (
      cacheStore.tasks[cacheKey] &&
      cacheStore.tasks[cacheKey].expiry > Date.now()
    ) {
      console.timeEnd("getUserTasks");
      return cacheStore.tasks[cacheKey].data;
    }

    const tasksResult = await db.queryDatabase(uid, "tasks", "uid");

    if (!tasksResult.success) {
      console.timeEnd("getUserTasks");
      return {
        success: false,
        error: tasksResult.error || "Failed to query tasks",
      };
    }

    if (!tasksResult.data || tasksResult.data.length === 0) {
      console.timeEnd("getUserTasks");

      cacheStore.tasks[cacheKey] = {
        data: { success: true, data: [] },
        expiry: Date.now() + CACHE_TTL.TASKS,
      };
      return { success: true, data: [] };
    }

    const tasks = tasksResult.data;

    tasks.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const result = { success: true, data: tasks };

    cacheStore.tasks[cacheKey] = {
      data: result,
      expiry: Date.now() + CACHE_TTL.TASKS,
    };

    console.timeEnd("getUserTasks");
    return result;
  } catch (err) {
    console.timeEnd("getUserTasks");
    console.error("Error in getUserTasks:", err);
    return {
      success: false,
      error:
        typeof err === "object" ? err.message || "Unknown error" : String(err),
    };
  }
};

module.exports.getGoalTasks = async function getGoalTasks(goalId) {
  const result = await db.queryDatabaseSingle(goalId, "goals");
  if (result.success) {
    return await db.queryMultiple(result.data.taskIds, "tasks");
  } else return result;
};

module.exports.deleteTask = async function deleteTask(uid, taskId, goalId) {
  if (goalId) {
    const taskResult = await db.queryDatabaseSingle(taskId, "tasks");
    if (!taskResult.success) {
      return taskResult;
    }
    const goalResult = await db.queryDatabaseSingle(goalId, "goals");
    if (!goalResult.success) {
      return goalResult;
    }
    const goalDelTaskIdRes = await db.removeFromFieldArray(
      "goals",
      goalId,
      "taskIds",
      taskId,
    );
    if (!goalDelTaskIdRes.success) return goalDelTaskIdRes;
    let daysLeft = Math.ceil(
      (new Date(goalResult.data.deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );

    if (taskResult.data.completedAt) {
      const completedAt = new Date(taskResult.data.completedAt);
      const today = new Date();
      if (
        completedAt.getDate() === today.getDate() &&
        completedAt.getMonth() === today.getMonth() &&
        completedAt.getFullYear() === today.getFullYear()
      ) {
        daysLeft--;
      }
    }
    let totalTasksDecreased = 0;
    switch (taskResult.data.frequency) {
      case "Daily":
        totalTasksDecreased = Math.ceil(daysLeft / 1);
        break;
      case "Weekly":
        totalTasksDecreased = Math.ceil(daysLeft / 7);
        break;
      case "Monthly":
        totalTasksDecreased = Math.ceil(daysLeft / 30);
        break;
      default:
        totalTasksDecreased = 0;
        break;
    }
    await db.incrementField(
      "goals",
      goalId,
      "totalTasks",
      -totalTasksDecreased,
    );
    console.log(
      `For goal: ${goalId}, total tasks decreased: ${totalTasksDecreased}`,
    );
  }
  const removeResult = await db.removeFromFieldArray(
    "users",
    uid,
    "tasks",
    taskId,
  );
  if (!removeResult.success) {
    return { success: false, error: removeResult.error };
  }
  if (goalId) {
    await db.removeFromFieldArray("goals", goalId, "taskIds", taskId);
  }
  const deleteResult = await db.deleteSingleDoc("tasks", taskId);

  clearUserCaches(uid);

  return deleteResult;
};

module.exports.toggleTaskCompletion = async function toggleTaskCompletion(
  uid,
  taskId,
  completed,
) {
  try {
    if (!taskId) {
      return { success: false, error: "Task ID is required" };
    }

    const task = await db.queryDatabaseSingle(taskId, "tasks");

    if (!task.success) {
      console.error(`Task query failed: ${JSON.stringify(task)}`);
      return {
        success: false,
        error: "Failed to find task: " + (task.message || "Unknown error"),
      };
    }

    if (!task.data) {
      console.error(`Task not found: ${taskId}`);
      return { success: false, error: "Task not found" };
    }

    if (task.data.uid !== uid) {
      console.error(
        `Task ownership mismatch. Task UID: ${task.data.uid}, User UID: ${uid}`,
      );
      return {
        success: false,
        error: "You don't have permission to modify this task",
      };
    }

    console.log(`Updating task ${taskId} completion status to ${completed}`);
    const update1 = await db.updateField(
      "tasks",
      taskId,
      "completed",
      completed,
    );

    if (!update1.success) {
      console.error(
        `Failed to update completion status: ${JSON.stringify(update1.error || "Unknown error")}`,
      );
      return {
        success: false,
        error:
          "Failed to update task completion status: " +
          (update1.error?.message || "Database error"),
      };
    }

    try {
      if (completed) {
        console.log(`Setting completedAt timestamp for task ${taskId}`);

        const userData = await db.queryDatabaseSingle(uid, "users");
        if (userData.success) {
          const plantHealth = userData.data.plantHealth;
          if (plantHealth < 6) {
            await db.incrementField("users", uid, "plantHealth", 1);
          }
        }

        const update2 = await db.updateField(
          "tasks",
          taskId,
          "completedAt",
          new Date().toISOString(),
        );
        if (!update2.success) {
          console.error(
            `Failed to update completedAt: ${JSON.stringify(update2.error || "Unknown error")}`,
          );

          return { success: true };
        }
        if (
          task.data.frequency &&
          task.data.frequency !== "" &&
          task.data.goalId
        ) {
          const goalResult = await db.queryDatabaseSingle(
            task.data.goalId,
            "goals",
          );
          if (!goalResult.success) {
            console.error(
              `Failed to query goal: ${JSON.stringify(goalResult.error || "Unknown error")}`,
            );

            return { success: true };
          }
          const daysLeft = Math.ceil(
            (new Date(goalResult.data.deadline) - new Date()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysLeft > 0) {
            const update3 = await db.incrementField(
              "goals",
              task.data.goalId,
              "completedTasks",
              1,
            );
            if (!update3.success) {
              console.error(
                `Failed to update goal completedTasks: ${JSON.stringify(update3.error || "Unknown error")}`,
              );

              return { success: true };
            }
          }
        }
      } else {
        console.log(`Clearing completedAt timestamp for task ${taskId}`);
        const update2 = await db.updateField(
          "tasks",
          taskId,
          "completedAt",
          null,
        );
        if (!update2.success) {
          console.error(
            `Failed to clear completedAt: ${JSON.stringify(update2.error || "Unknown error")}`,
          );

          return { success: true };
        }

        try {
          console.log(`Removing happiness ratings for task ${taskId}`);

          const happinessResult = await db.queryDatabase(
            taskId,
            "happiness",
            "taskId",
          );

          if (
            happinessResult.success &&
            happinessResult.data &&
            happinessResult.data.length > 0
          ) {
            console.log(
              `Found ${happinessResult.data.length} happiness ratings to remove for task ${taskId}`,
            );

            for (const happiness of happinessResult.data) {
              await db.removeFromFieldArray(
                "users",
                uid,
                "happiness",
                happiness.id,
              );

              await db.deleteSingleDoc("happiness", happiness.id);

              console.log(
                `Removed happiness rating ${happiness.id} for task ${taskId}`,
              );
            }
          } else {
            console.log(`No happiness ratings found for task ${taskId}`);
          }
        } catch (happinessError) {
          console.error(`Error removing happiness ratings: ${happinessError}`);
        }

        if (
          task.data.frequency &&
          task.data.frequency !== "" &&
          task.data.goalId
        ) {
          const goalResult = await db.queryDatabaseSingle(
            task.data.goalId,
            "goals",
          );
          if (!goalResult.success) {
            console.error(
              `Failed to query goal: ${JSON.stringify(goalResult.error || "Unknown error")}`,
            );

            return { success: true };
          }
          const daysLeft = Math.ceil(
            (new Date(goalResult.data.deadline) - new Date()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysLeft > 0) {
            const update3 = await db.incrementField(
              "goals",
              task.data.goalId,
              "completedTasks",
              -1,
            );
            if (!update3.success) {
              console.error(
                `Failed to update goal completedTasks: ${JSON.stringify(update3.error || "Unknown error")}`,
              );

              return { success: true };
            }
          }
        }
      }

      clearUserCaches(uid);

      return { success: true };
    } catch (timestampErr) {
      console.error(`Error updating timestamp: ${timestampErr}`);

      return { success: true };
    }
  } catch (err) {
    console.error("Error toggling task completion:", err);
    return {
      success: false,
      error:
        typeof err === "object" && err !== null
          ? err.message || "Unknown error occurred"
          : String(err),
    };
  }
};

module.exports.getTaskHistory = async function getTaskHistory(
  uid,
  startDate,
  endDate,
  lastDoc,
) {
  try {
    const cacheKey = getHistoryCacheKey(uid, startDate, endDate);

    if (
      !lastDoc &&
      cacheStore.history[cacheKey] &&
      cacheStore.history[cacheKey].timestamp > Date.now() - CACHE_TTL.HISTORY
    ) {
      console.log(`Using cached task history for ${cacheKey}`);

      const cachedResults = cacheStore.history[cacheKey].data;

      return {
        success: true,
        data: cachedResults,
      };
    }

    console.log(`Fetching task history from database for ${cacheKey}`);

    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return { success: false, error: "User not found" };
    }

    const tasksResult = await this.getUserTasks(uid);
    if (!tasksResult.success) {
      return {
        success: false,
        error: tasksResult.error || "Failed to fetch tasks",
      };
    }

    let completedTasks = tasksResult.data.filter(
      (task) => task.completed && task.completedAt,
    );

    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      completedTasks = completedTasks.filter(
        (task) => new Date(task.completedAt).getTime() >= startDateTime,
      );
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      completedTasks = completedTasks.filter(
        (task) => new Date(task.completedAt).getTime() < endDateTime.getTime(),
      );
    }

    completedTasks.sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );

    const fullResults = {
      completions: completedTasks,
      streaks: calculateStreaks(completedTasks),
    };

    if (!lastDoc) {
      cacheStore.history[cacheKey] = {
        timestamp: Date.now(),
        data: fullResults,
      };
    }

    const pageSize = 10;
    let paginatedTasks = completedTasks;
    let nextLastDoc = null;

    if (lastDoc) {
      const lastIndex = completedTasks.findIndex((task) => task.id === lastDoc);
      if (lastIndex !== -1 && lastIndex + 1 < completedTasks.length) {
        paginatedTasks = completedTasks.slice(
          lastIndex + 1,
          lastIndex + 1 + pageSize,
        );

        if (lastIndex + 1 + pageSize < completedTasks.length) {
          nextLastDoc = paginatedTasks[paginatedTasks.length - 1].id;
        }
      } else {
        paginatedTasks = [];
      }
    } else {
      paginatedTasks = completedTasks.slice(0, pageSize);
      if (pageSize < completedTasks.length) {
        nextLastDoc = paginatedTasks[paginatedTasks.length - 1].id;
      }
    }

    const paginatedResults = {
      completions: paginatedTasks,
      lastDoc: nextLastDoc,
      streaks: fullResults.streaks,
    };

    return {
      success: true,
      data: paginatedResults,
    };
  } catch (err) {
    console.error("Error getting task history:", err);
    return {
      success: false,
      error:
        typeof err === "object" ? err.message || "Unknown error" : String(err),
    };
  }
};

function calculateStreaks(completedTasks) {
  if (!completedTasks || completedTasks.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      completionsLast7Days: 0,
      completionsLast30Days: 0,
      totalCompletions: 0,
    };
  }

  const sortedByDate = [...completedTasks].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = 0;
  let lastDate = null;

  const mostRecentDate = new Date(sortedByDate[0].completedAt);
  const mostRecentDay = new Date(
    mostRecentDate.getFullYear(),
    mostRecentDate.getMonth(),
    mostRecentDate.getDate(),
  );

  if (mostRecentDay < yesterday) {
    currentStreak = 0;
  } else {
    const dates = new Set();
    sortedByDate.forEach((task) => {
      const date = new Date(task.completedAt);
      dates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });

    const dateArray = Array.from(dates).map((dateString) => {
      const [year, month, day] = dateString.split("-").map(Number);
      return new Date(year, month, day);
    });

    dateArray.sort((a, b) => b.getTime() - a.getTime());

    currentStreak = 0;
    for (let i = 0; i < dateArray.length; i++) {
      const date = dateArray[i];

      if (i === 0) {
        if (date >= yesterday) {
          currentStreak = 1;
          lastDate = date;
        } else {
          break;
        }
      } else {
        const expectedDate = new Date(lastDate);
        expectedDate.setDate(expectedDate.getDate() - 1);

        if (
          date.getFullYear() === expectedDate.getFullYear() &&
          date.getMonth() === expectedDate.getMonth() &&
          date.getDate() === expectedDate.getDate()
        ) {
          currentStreak++;
          lastDate = date;
        } else {
          break;
        }
      }
    }
  }

  let longestStreak = 0;
  let currentRunStreak = 1;
  let lastCompletionDate = null;

  const completionsByDate = {};
  for (const task of completedTasks) {
    const date = new Date(task.completedAt);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!completionsByDate[dateKey]) {
      completionsByDate[dateKey] = [];
    }
    completionsByDate[dateKey].push(task);
  }

  const sortedDates = Object.keys(completionsByDate).sort();

  for (let i = 0; i < sortedDates.length; i++) {
    const dateKey = sortedDates[i];
    const [year, month, day] = dateKey.split("-").map(Number);
    const currentDate = new Date(year, month, day);

    if (i === 0) {
      lastCompletionDate = currentDate;
      currentRunStreak = 1;
    } else {
      const dayDiff = Math.round(
        (currentDate.getTime() - lastCompletionDate.getTime()) /
          (1000 * 3600 * 24),
      );

      if (dayDiff === 1) {
        currentRunStreak++;
      } else {
        if (currentRunStreak > longestStreak) {
          longestStreak = currentRunStreak;
        }
        currentRunStreak = 1;
      }

      lastCompletionDate = currentDate;
    }
  }

  if (currentRunStreak > longestStreak) {
    longestStreak = currentRunStreak;
  }

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const completionsLast7Days = completedTasks.filter(
    (task) => new Date(task.completedAt) >= sevenDaysAgo,
  ).length;

  const completionsLast30Days = completedTasks.filter(
    (task) => new Date(task.completedAt) >= thirtyDaysAgo,
  ).length;

  return {
    currentStreak,
    longestStreak,
    completionsLast7Days,
    completionsLast30Days,
    totalCompletions: completedTasks.length,
  };
}

/**
 * Submit a happiness rating for a completed task
 * @param {string} uid - User ID
 * @param {string} taskId - Task ID
 * @param {number} rating - Happiness rating (1-5)
 * @param {string} date - ISO date string when the rating was submitted
 * @returns {Object} Result object with success flag
 */
module.exports.submitHappinessRating = async function submitHappinessRating(
  uid,
  taskId,
  rating,
  date,
) {
  try {
    if (!uid || !taskId) {
      return { success: false, error: "User ID and Task ID are required" };
    }

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return {
        success: false,
        error: "Valid happiness rating (1-5) is required",
      };
    }

    const task = await db.queryDatabaseSingle(taskId, "tasks");
    if (!task.success || !task.data) {
      return { success: false, error: "Task not found" };
    }

    if (task.data.uid !== uid) {
      return {
        success: false,
        error: "You don't have permission to rate this task",
      };
    }

    if (!task.data.completed) {
      return { success: false, error: "Cannot rate an incomplete task" };
    }

    const existingRatings = await db.queryDatabase(uid, "happiness", "uid");

    if (
      existingRatings.success &&
      existingRatings.data &&
      existingRatings.data.length > 0
    ) {
      const today = new Date(date).toISOString().split("T")[0];

      const duplicateRating = existingRatings.data.find((rating) => {
        const ratingDate = new Date(rating.date).toISOString().split("T")[0];
        return rating.taskId === taskId && ratingDate === today;
      });

      if (duplicateRating) {
        const updateResult = await db.updateField(
          "happiness",
          duplicateRating.id,
          "rating",
          rating,
        );
        if (!updateResult.success) {
          return {
            success: false,
            error: "Failed to update existing happiness rating",
          };
        }
        return {
          success: true,
          data: { id: duplicateRating.id, updated: true },
        };
      }
    }

    const happinessData = {
      uid,
      taskId,
      taskTitle: task.data.title || "",
      rating,
      date,
      createdAt: new Date().toISOString(),
    };

    const addResult = await db.addSingleDoc("happiness", happinessData);

    if (!addResult.success) {
      return { success: false, error: "Failed to save happiness rating" };
    }

    const updateResult = await db.updateFieldArray(
      "users",
      uid,
      "happiness",
      addResult.id,
    );

    if (!updateResult.success) {
      await db.deleteSingleDoc("happiness", addResult.id);
      return {
        success: false,
        error: "Failed to update user with happiness rating",
      };
    }

    return { success: true, data: { id: addResult.id, updated: false } };
  } catch (error) {
    console.error("Error in submitHappinessRating:", error);
    return {
      success: false,
      error: typeof error === "object" ? error.message : String(error),
    };
  }
};

/**
 * Get a user's happiness rating data
 * @param {string} uid - User ID
 * @param {string} startDate - Optional start date for filtering (ISO date string)
 * @param {string} endDate - Optional end date for filtering (ISO date string)
 * @returns {Object} Result object with happiness data
 */
module.exports.getHappinessData = async function getHappinessData(
  uid,
  startDate,
  endDate,
) {
  try {
    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return { success: false, error: "User not found" };
    }

    const happinessResult = await db.queryDatabase(uid, "happiness", "uid");

    if (!happinessResult.success) {
      return {
        success: false,
        error: happinessResult.error || "Failed to fetch happiness data",
      };
    }

    let happinessData = happinessResult.data || [];

    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      happinessData = happinessData.filter(
        (item) => new Date(item.date).getTime() >= startDateTime,
      );
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);

      happinessData = happinessData.filter(
        (item) => new Date(item.date).getTime() < endDateTime.getTime(),
      );
    }

    happinessData.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    let averageHappiness = 0;
    if (happinessData.length > 0) {
      const sum = happinessData.reduce((acc, item) => acc + item.rating, 0);
      averageHappiness = sum / happinessData.length;
    }

    return {
      success: true,
      data: {
        ratings: happinessData,
        averageHappiness,
        count: happinessData.length,
      },
    };
  } catch (error) {
    console.error("Error in getHappinessData:", error);
    return {
      success: false,
      error: typeof error === "object" ? error.message : String(error),
    };
  }
};

module.exports.resetRecurringTasks = async function resetRecurringTasks() {
  try {
    console.log("Starting scheduled task reset check...");

    let plantHealthPromise = decrementPlantHealth();

    const completedTasksResult = await db.queryDatabaseCustom("tasks", [
      ["completed", "==", true],
      ["frequency", "in", ["Daily", "Weekly", "Monthly"]],
    ]);

    if (!completedTasksResult.success || !completedTasksResult.data) {
      console.error(
        "Failed to fetch completed recurring tasks:",
        completedTasksResult.error,
      );
      return { success: false, error: "Failed to fetch tasks for reset" };
    }

    const tasksToReset = [];
    const now = new Date();

    const decrementByUID = new Map();

    for (const task of completedTasksResult.data) {
      if (!task.completedAt) continue;

      const completedDate = new Date(task.completedAt);
      let shouldReset = false;

      switch (task.frequency) {
        case "Daily":
          shouldReset =
            completedDate.getDate() !== now.getDate() ||
            completedDate.getMonth() !== now.getMonth() ||
            completedDate.getFullYear() !== now.getFullYear();
          break;

        case "Weekly":
          const oneWeekAgo = new Date(now);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          shouldReset = completedDate < oneWeekAgo;
          break;

        case "Monthly":
          shouldReset =
            completedDate.getMonth() !== now.getMonth() ||
            completedDate.getFullYear() !== now.getFullYear();
          break;
      }

      if (shouldReset) {
        if (decrementByUID.has(task.uid)) {
          decrementByUID.set(task.uid, decrementByUID.get(task.uid) - 1);
        } else {
          decrementByUID.set(task.uid, -1);
        }
        tasksToReset.push(task.id);
        console.log(
          `Task ${task.id} (${task.title}) - ${task.frequency} will be reset from completed state`,
        );
      }
    }

    const resetResults = [];
    for (const taskId of tasksToReset) {
      try {
        const updateResult = await db.updateField(
          "tasks",
          taskId,
          "completed",
          false,
        );
        if (updateResult.success) {
          await db.updateField("tasks", taskId, "completedAt", null);
          resetResults.push({ taskId, success: true });
        } else {
          resetResults.push({
            taskId,
            success: false,
            error: updateResult.error,
          });
        }
      } catch (resetErr) {
        console.error(`Error resetting task ${taskId}:`, resetErr);
        resetResults.push({ taskId, success: false, error: resetErr.message });
      }
    }

    await plantHealthPromise;

    console.log(
      `Completed task reset check. Reset ${tasksToReset.length} tasks.`,
    );
    return {
      success: true,
      message: `Reset ${tasksToReset.length} recurring tasks`,
      data: { tasksReset: tasksToReset.length, details: resetResults },
    };
  } catch (err) {
    console.error("Error in resetRecurringTasks:", err);
    return {
      success: false,
      error:
        typeof err === "object" ? err.message || "Unknown error" : String(err),
    };
  }
};

module.exports.associateTaskWithGoal = async function associateTaskWithGoal(
  uid,
  taskId,
  goalId,
) {
  try {
    const taskResult = await db.queryDatabaseSingle(taskId, "tasks");
    if (!taskResult.success) {
      return { success: false, error: "Task not found" };
    }

    if (taskResult.data.uid !== uid) {
      return {
        success: false,
        error: "You don't have permission to modify this task",
      };
    }

    if (taskResult.data.goalId) {
      return {
        success: false,
        error: "Task is already associated with a goal",
      };
    }

    const goalResult = await db.queryDatabaseSingle(goalId, "goals");
    if (!goalResult.success) {
      return { success: false, error: "Goal not found" };
    }

    if (goalResult.data.uid !== uid) {
      return {
        success: false,
        error: "You don't have permission to modify this goal",
      };
    }

    const updateTaskResult = await db.updateField(
      "tasks",
      taskId,
      "goalId",
      goalId,
    );
    if (!updateTaskResult.success) {
      return { success: false, error: "Failed to update task" };
    }

    const updateGoalResult = await db.updateFieldArray(
      "goals",
      goalId,
      "taskIds",
      taskId,
    );
    if (!updateGoalResult.success) {
      await db.updateField("tasks", taskId, "goalId", null);
      return { success: false, error: "Failed to update goal" };
    }

    const task = taskResult.data;
    const goal = goalResult.data;
    const daysLeft = Math.ceil(
      (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );

    let totalTasks = 0;

    switch (task.frequency) {
      case "Daily":
        totalTasks = Math.ceil(daysLeft / 1);
        break;
      case "Weekly":
        totalTasks = Math.ceil(daysLeft / 7);
        break;
      case "Monthly":
        totalTasks = Math.ceil(daysLeft / 30);
        break;
      default:
        totalTasks = 0;
        break;
    }

    await db.incrementField("goals", goalId, "totalTasks", totalTasks);

    clearUserCaches(uid);

    return { success: true, data: { taskId, goalId } };
  } catch (error) {
    console.error("Error in associateTaskWithGoal:", error);
    return {
      success: false,
      error:
        typeof error === "object"
          ? error.message || "Unknown error"
          : String(error),
    };
  }
};

module.exports.unassociateTaskFromGoal = async function unassociateTaskFromGoal(
  uid,
  taskId,
) {
  try {
    const taskResult = await db.queryDatabaseSingle(taskId, "tasks");
    if (!taskResult.success) {
      return { success: false, error: "Task not found" };
    }

    if (taskResult.data.uid !== uid) {
      return {
        success: false,
        error: "You don't have permission to modify this task",
      };
    }

    if (!taskResult.data.goalId) {
      return { success: false, error: "Task is not associated with any goal" };
    }

    const goalId = taskResult.data.goalId;

    const goalResult = await db.queryDatabaseSingle(goalId, "goals");
    if (!goalResult.success) {
      return { success: false, error: "Goal not found" };
    }

    if (goalResult.data.uid !== uid) {
      return {
        success: false,
        error: "You don't have permission to modify this goal",
      };
    }

    const updateTaskResult = await db.updateField(
      "tasks",
      taskId,
      "goalId",
      null,
    );
    if (!updateTaskResult.success) {
      return { success: false, error: "Failed to update task" };
    }

    const updateGoalResult = await db.removeFromFieldArray(
      "goals",
      goalId,
      "taskIds",
      taskId,
    );
    if (!updateGoalResult.success) {
      await db.updateField("tasks", taskId, "goalId", goalId);
      return { success: false, error: "Failed to update goal" };
    }

    const task = taskResult.data;
    const goal = goalResult.data;
    const daysLeft = Math.ceil(
      (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );

    let totalTasks = 0;

    switch (task.frequency) {
      case "Daily":
        totalTasks = Math.ceil(daysLeft / 1);
        break;
      case "Weekly":
        totalTasks = Math.ceil(daysLeft / 7);
        break;
      case "Monthly":
        totalTasks = Math.ceil(daysLeft / 30);
        break;
      default:
        totalTasks = 0;
        break;
    }

    await db.incrementField("goals", goalId, "totalTasks", -totalTasks);

    if (task.completed) {
      await db.incrementField("goals", goalId, "completedTasks", -1);
    }

    clearUserCaches(uid);

    return { success: true, data: { taskId, goalId } };
  } catch (error) {
    console.error("Error in unassociateTaskFromGoal:", error);
    return {
      success: false,
      error:
        typeof error === "object"
          ? error.message || "Unknown error"
          : String(error),
    };
  }
};

async function decrementPlantHealth() {
  try {
    const collectionRef = db.getCollectionRef("users");
    const snapshot = await collectionRef.get();
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const currentPlantHealth = doc.data().plantHealth || 1;
      if (currentPlantHealth > 1) {
        const docRef = collectionRef.doc(doc.id);
        batch.update(docRef, { plantHealth: currentPlantHealth - 1 });
      }
    });

    await db.commitBatch(batch);
  } catch (error) {
    console.error("Error decrementing field:", error);
  }
}
