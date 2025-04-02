const db = require("../firebase/firestore");

// Improved cache implementation with shorter TTLs for real-time updates
const cacheStore = {
  tasks: {}, // Cache for user tasks
  history: {}, // Cache for task history
};

// Shorter cache TTLs for more responsive UI
const CACHE_TTL = {
  TASKS: 10 * 1000, // 10 seconds for tasks
  HISTORY: 30 * 1000, // 30 seconds for history
};

// Clear all caches for a user to ensure fresh data
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

// Helper function to get cache key for history
function getHistoryCacheKey(uid, startDate, endDate) {
  return `${uid}:${startDate || ""}:${endDate || ""}`;
}

module.exports.createTask = async function createTask(uid, task, goalId) {
  try {
    // Set the uid on the task
    task.uid = uid;
    // Create a new task document in the "tasks" collection
    const taskResult = await db.addSingleDoc("tasks", task);
    if (!taskResult.success) {
      return { success: false, error: taskResult.error };
    }
    // Update the user's document in the "users" collection by adding the new task id to the tasks array
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
      // Update fields in the goal document
      await db.updateFieldArray("goals", goalId, "taskIds", taskResult.id);
      const goalResult = await db.queryDatabaseSingle(goalId, "goals");
      if (!goalResult.success) {
        return goalResult;
      }
      const goal = goalResult.data;
      const daysLeft = Math.ceil(
        (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24),
      );
      let totalTasks = 0;
      // Calculate total tasks incompleted based on goal deadline and frequency
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

    // Clear caches for this user to ensure fresh data
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
    // Update the parent goal document fields
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
        // if taskResult.data.completedAt ("2025-03-12T20:45:54.133Z") is today ("2025-03-12"), we need to subtract 1 from daysLeft
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

    // Clear caches for this user to ensure fresh data
    clearUserCaches(uid);

    return updateResult;
  } else return result;
};

module.exports.getUserTasks = async function getUserTasks(uid) {
  console.time("getUserTasks");
  try {
    // Check if we have a cached version
    const cacheKey = `tasks_${uid}`;
    if (
      cacheStore.tasks[cacheKey] &&
      cacheStore.tasks[cacheKey].expiry > Date.now()
    ) {
      console.timeEnd("getUserTasks");
      return cacheStore.tasks[cacheKey].data;
    }

    // Use queryDatabase helper function instead of direct db access
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

      // Cache empty result
      cacheStore.tasks[cacheKey] = {
        data: { success: true, data: [] },
        expiry: Date.now() + CACHE_TTL.TASKS,
      };
      return { success: true, data: [] };
    }

    // Process the tasks (they are already in the right format from queryDatabase)
    const tasks = tasksResult.data;

    // Sort by createdAt (newest first)
    tasks.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const result = { success: true, data: tasks };

    // Cache with shorter TTL for more responsive UI
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
  // Update goal document on totalTasks field
  if (goalId) {
    const taskResult = await db.queryDatabaseSingle(taskId, "tasks");
    if (!taskResult.success) {
      return taskResult;
    }
    const goalResult = await db.queryDatabaseSingle(goalId, "goals");
    if (!goalResult.success) {
      return goalResult;
    }
    let daysLeft = Math.ceil(
      (new Date(goalResult.data.deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );
    // if taskResult.data.completedAt ("2025-03-12T20:45:54.133Z") is today ("2025-03-12"), we need to subtract 1 from daysLeft
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

  // Clear all caches for this user to ensure fresh data
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

    // Verify the task exists and belongs to the user
    const task = await db.queryDatabaseSingle(taskId, "tasks");

    // Better error handling for task not found
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

    // Verify task ownership (security check)
    if (task.data.uid !== uid) {
      console.error(
        `Task ownership mismatch. Task UID: ${task.data.uid}, User UID: ${uid}`,
      );
      return {
        success: false,
        error: "You don't have permission to modify this task",
      };
    }

    // Update the completion status with improved error handling
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

    // If marked as complete, set completedAt timestamp
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
          // We succeeded with the main update, so return success even if timestamp update fails
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
            // We succeeded with the main update, so return success even if goal update fails
            return { success: true };
          }
          const daysLeft = Math.ceil(
            (new Date(goalResult.data.deadline) - new Date()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysLeft > 0) {
            // Update fields in the goal document
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
              // We succeeded with the main update, so return success even if goal update fails
              return { success: true };
            }
          }
        }
      } else {
        // If marked as incomplete, remove completedAt
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
          // We succeeded with the main update, so return success even if timestamp update fails
          return { success: true };
        }

        // When task is marked as incomplete, remove associated happiness ratings
        try {
          console.log(`Removing happiness ratings for task ${taskId}`);

          // Find happiness ratings associated with this task
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

            // Delete each happiness rating
            for (const happiness of happinessResult.data) {
              // First remove the happiness ID from the user's happiness array
              await db.removeFromFieldArray(
                "users",
                uid,
                "happiness",
                happiness.id,
              );

              // Then delete the happiness document
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
          // Continue with task update even if happiness removal fails
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
            // We succeeded with the main update, so return success even if goal update fails
            return { success: true };
          }
          const daysLeft = Math.ceil(
            (new Date(goalResult.data.deadline) - new Date()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysLeft > 0) {
            // Update fields in the goal document
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
              // We succeeded with the main update, so return success even if goal update fails
              return { success: true };
            }
          }
        }
      }

      // Clear all caches for this user to ensure fresh data everywhere
      clearUserCaches(uid);

      return { success: true };
    } catch (timestampErr) {
      console.error(`Error updating timestamp: ${timestampErr}`);
      // Main update succeeded, so still return success
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

    // Check if we have a valid cache entry for this query
    if (
      !lastDoc &&
      cacheStore.history[cacheKey] &&
      cacheStore.history[cacheKey].timestamp > Date.now() - CACHE_TTL.HISTORY
    ) {
      console.log(`Using cached task history for ${cacheKey}`);

      // Apply pagination if lastDoc provided
      const cachedResults = cacheStore.history[cacheKey].data;

      return {
        success: true,
        data: cachedResults,
      };
    }

    // No valid cache entry, proceed with database query
    console.log(`Fetching task history from database for ${cacheKey}`);

    // Verify user exists
    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return { success: false, error: "User not found" };
    }

    // Get all tasks for the user
    const tasksResult = await this.getUserTasks(uid);
    if (!tasksResult.success) {
      return {
        success: false,
        error: tasksResult.error || "Failed to fetch tasks",
      };
    }

    // Filter for completed tasks with completedAt field
    let completedTasks = tasksResult.data.filter(
      (task) => task.completed && task.completedAt,
    );

    // Apply date filtering if provided
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      completedTasks = completedTasks.filter(
        (task) => new Date(task.completedAt).getTime() >= startDateTime,
      );
    }

    if (endDate) {
      // Add one day to include the end date fully
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      completedTasks = completedTasks.filter(
        (task) => new Date(task.completedAt).getTime() < endDateTime.getTime(),
      );
    }

    // Sort by completedAt (newest first)
    completedTasks.sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );

    // Create full result set for caching
    const fullResults = {
      completions: completedTasks,
      streaks: calculateStreaks(completedTasks),
    };

    // Cache the full results (not paginated) with shorter TTL
    if (!lastDoc) {
      cacheStore.history[cacheKey] = {
        timestamp: Date.now(),
        data: fullResults,
      };
    }

    // Apply pagination
    const pageSize = 10;
    let paginatedTasks = completedTasks;
    let nextLastDoc = null;

    if (lastDoc) {
      // Find the index of the last document
      const lastIndex = completedTasks.findIndex((task) => task.id === lastDoc);
      if (lastIndex !== -1 && lastIndex + 1 < completedTasks.length) {
        paginatedTasks = completedTasks.slice(
          lastIndex + 1,
          lastIndex + 1 + pageSize,
        );

        // Set next lastDoc for pagination
        if (lastIndex + 1 + pageSize < completedTasks.length) {
          nextLastDoc = paginatedTasks[paginatedTasks.length - 1].id;
        }
      } else {
        paginatedTasks = [];
      }
    } else {
      // First page
      paginatedTasks = completedTasks.slice(0, pageSize);
      if (pageSize < completedTasks.length) {
        nextLastDoc = paginatedTasks[paginatedTasks.length - 1].id;
      }
    }

    // Prepare paginated response
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

// Helper function to calculate streaks and consistency
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

  // Sort by date (most recent first) for streak calculation
  const sortedByDate = [...completedTasks].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Calculate current streak
  let currentStreak = 0;
  let lastDate = null;

  // Check if there's a completion today
  const mostRecentDate = new Date(sortedByDate[0].completedAt);
  const mostRecentDay = new Date(
    mostRecentDate.getFullYear(),
    mostRecentDate.getMonth(),
    mostRecentDate.getDate(),
  );

  // If most recent completion is from before yesterday, streak is 0
  if (mostRecentDay < yesterday) {
    currentStreak = 0;
  } else {
    // Count consecutive days with completions
    const dates = new Set();
    sortedByDate.forEach((task) => {
      const date = new Date(task.completedAt);
      dates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });

    // Convert to array of Date objects
    const dateArray = Array.from(dates).map((dateString) => {
      const [year, month, day] = dateString.split("-").map(Number);
      return new Date(year, month, day);
    });

    // Sort dates in descending order (newest first)
    dateArray.sort((a, b) => b.getTime() - a.getTime());

    // Count current streak
    currentStreak = 0;
    for (let i = 0; i < dateArray.length; i++) {
      const date = dateArray[i];

      if (i === 0) {
        // First date in streak must be today or yesterday
        if (date >= yesterday) {
          currentStreak = 1;
          lastDate = date;
        } else {
          break; // No current streak
        }
      } else {
        // Check if this date is consecutive with last date
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
          break; // End of streak
        }
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let currentRunStreak = 1;
  let lastCompletionDate = null;

  // Group by date
  const completionsByDate = {};
  for (const task of completedTasks) {
    const date = new Date(task.completedAt);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!completionsByDate[dateKey]) {
      completionsByDate[dateKey] = [];
    }
    completionsByDate[dateKey].push(task);
  }

  // Sort dates
  const sortedDates = Object.keys(completionsByDate).sort();

  // Calculate longest streak
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

  // Check if the last run is the longest
  if (currentRunStreak > longestStreak) {
    longestStreak = currentRunStreak;
  }

  // Count completions in last 7 and 30 days
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
    // Validate inputs
    if (!uid || !taskId) {
      return { success: false, error: "User ID and Task ID are required" };
    }

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return {
        success: false,
        error: "Valid happiness rating (1-5) is required",
      };
    }

    // Ensure the task exists and belongs to the user
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

    // Verify the task is completed
    if (!task.data.completed) {
      return { success: false, error: "Cannot rate an incomplete task" };
    }

    // Check for duplicate rating (same task, same day)
    const existingRatings = await db.queryDatabase(uid, "happiness", "uid");

    if (
      existingRatings.success &&
      existingRatings.data &&
      existingRatings.data.length > 0
    ) {
      const today = new Date(date).toISOString().split("T")[0]; // Get YYYY-MM-DD part

      const duplicateRating = existingRatings.data.find((rating) => {
        // Same task and same day
        const ratingDate = new Date(rating.date).toISOString().split("T")[0];
        return rating.taskId === taskId && ratingDate === today;
      });

      if (duplicateRating) {
        // Update existing rating instead of creating a new one
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

    // Create a new happiness rating document
    const happinessData = {
      uid,
      taskId,
      taskTitle: task.data.title || "",
      rating,
      date,
      createdAt: new Date().toISOString(),
    };

    // Add to happiness collection
    const addResult = await db.addSingleDoc("happiness", happinessData);

    if (!addResult.success) {
      return { success: false, error: "Failed to save happiness rating" };
    }

    // Add the rating ID to the user's happiness array
    const updateResult = await db.updateFieldArray(
      "users",
      uid,
      "happiness",
      addResult.id,
    );

    if (!updateResult.success) {
      // Clean up the orphaned happiness document
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
    // Validate user
    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return { success: false, error: "User not found" };
    }

    // Get all happiness ratings for the user
    const happinessResult = await db.queryDatabase(uid, "happiness", "uid");

    if (!happinessResult.success) {
      return {
        success: false,
        error: happinessResult.error || "Failed to fetch happiness data",
      };
    }

    let happinessData = happinessResult.data || [];

    // Apply date filtering if provided
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      happinessData = happinessData.filter(
        (item) => new Date(item.date).getTime() >= startDateTime,
      );
    }

    if (endDate) {
      // Add one day to include the end date fully
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);

      happinessData = happinessData.filter(
        (item) => new Date(item.date).getTime() < endDateTime.getTime(),
      );
    }

    // Sort by date (newest first)
    happinessData.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Calculate average happiness
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

    // Get all completed tasks with frequencies
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

    // Determine which tasks need to be reset
    for (const task of completedTasksResult.data) {
      if (!task.completedAt) continue; // Skip if no completion date

      const completedDate = new Date(task.completedAt);
      let shouldReset = false;

      switch (task.frequency) {
        case "Daily":
          // Reset if completed before today
          shouldReset =
            completedDate.getDate() !== now.getDate() ||
            completedDate.getMonth() !== now.getMonth() ||
            completedDate.getFullYear() !== now.getFullYear();
          break;

        case "Weekly":
          // Reset if completed more than 7 days ago
          const oneWeekAgo = new Date(now);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          shouldReset = completedDate < oneWeekAgo;
          break;

        case "Monthly":
          // Reset if completed in a previous month
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

    // Reset tasks that need to be reset
    const resetResults = [];
    for (const taskId of tasksToReset) {
      try {
        // Reset to incomplete and clear completedAt
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
    // First, verify the task exists and belongs to this user
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

    // Check if task is already associated with a goal
    if (taskResult.data.goalId) {
      return {
        success: false,
        error: "Task is already associated with a goal",
      };
    }

    // Verify the goal exists and belongs to this user
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

    // Update the task with the goalId
    const updateTaskResult = await db.updateField(
      "tasks",
      taskId,
      "goalId",
      goalId,
    );
    if (!updateTaskResult.success) {
      return { success: false, error: "Failed to update task" };
    }

    // Add the task to the goal's taskIds array
    const updateGoalResult = await db.updateFieldArray(
      "goals",
      goalId,
      "taskIds",
      taskId,
    );
    if (!updateGoalResult.success) {
      // Revert the task update if the goal update fails
      await db.updateField("tasks", taskId, "goalId", null);
      return { success: false, error: "Failed to update goal" };
    }

    // Update goal's totalTasks count based on task frequency
    const task = taskResult.data;
    const goal = goalResult.data;
    const daysLeft = Math.ceil(
      (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );

    let totalTasks = 0;
    // Calculate total tasks based on frequency
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

    // Increment the goal's totalTasks
    await db.incrementField("goals", goalId, "totalTasks", totalTasks);

    // Clear caches for this user to ensure fresh data
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
    // First, verify the task exists and belongs to this user
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

    // Check if task is associated with a goal
    if (!taskResult.data.goalId) {
      return { success: false, error: "Task is not associated with any goal" };
    }

    const goalId = taskResult.data.goalId;

    // Verify the goal exists
    const goalResult = await db.queryDatabaseSingle(goalId, "goals");
    if (!goalResult.success) {
      return { success: false, error: "Goal not found" };
    }

    // Check if the user owns the goal
    if (goalResult.data.uid !== uid) {
      return {
        success: false,
        error: "You don't have permission to modify this goal",
      };
    }

    // Update the task to remove the goalId
    const updateTaskResult = await db.updateField(
      "tasks",
      taskId,
      "goalId",
      null,
    );
    if (!updateTaskResult.success) {
      return { success: false, error: "Failed to update task" };
    }

    // Remove the task from the goal's taskIds array
    const updateGoalResult = await db.removeFromFieldArray(
      "goals",
      goalId,
      "taskIds",
      taskId,
    );
    if (!updateGoalResult.success) {
      // Revert the task update if the goal update fails
      await db.updateField("tasks", taskId, "goalId", goalId);
      return { success: false, error: "Failed to update goal" };
    }

    // Update goal's totalTasks count based on task frequency
    const task = taskResult.data;
    const goal = goalResult.data;
    const daysLeft = Math.ceil(
      (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );

    let totalTasks = 0;
    // Calculate total tasks based on frequency
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

    // Decrement the goal's totalTasks
    await db.incrementField("goals", goalId, "totalTasks", -totalTasks);

    // If the task was completed and counted toward completedTasks, decrement that too
    if (task.completed) {
      await db.incrementField("goals", goalId, "completedTasks", -1);
    }

    // Clear caches for this user to ensure fresh data
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
    // Fetch all documents from the collection
    const collectionRef = db.getCollectionRef("users");
    const snapshot = await collectionRef.get();
    const batch = db.batch(); // Start a batch for multiple writes

    snapshot.forEach((doc) => {
      // Get current field value (assuming the field is called 'count')
      const currentPlantHealth = doc.data().plantHealth || 1; // Default to 0 if field is missing
      if (currentPlantHealth > 1) {
        const docRef = collectionRef.doc(doc.id);
        batch.update(docRef, { plantHealth: currentPlantHealth - 1 });
      }
    });

    // Commit the batch to apply all updates
    await db.commitBatch(batch);
  } catch (error) {
    console.error("Error decrementing field:", error);
  }
}
