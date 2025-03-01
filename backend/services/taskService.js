const db = require("../firebase/firestore");
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
        const updateResult = await db.updateFieldArray("users", uid, "tasks", taskResult.id);
        if (!updateResult.success) {
            return { success: false, error: updateResult.error };
        }
        if (goalId) {
            await db.updateFieldArray("goals", goalId, "taskIds", taskResult.id);
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err };
    }
};

module.exports.editTask = async function editTask(uid, taskId, fieldToChange, newValue) {
    const result = await db.queryDatabaseSingle(uid, "users");
    if (result.success) {
        return await db.updateField("tasks", taskId, fieldToChange, newValue);
    } else return result;
}

module.exports.getUserTasks = async function getUserTasks(uid) {
    const result = await db.queryDatabaseSingle(uid, "users");
    if (result.success) {
        return await db.queryMultiple(result.data.tasks, "tasks");
    } else return result;
}

module.exports.getGoalTasks = async function getGoalTasks(uid) {
    const result = await db.queryDatabaseSingle(uid, "goals");
    if (result.success) {
        return await db.queryMultiple(result.data.taskIds, "tasks");
    } else return result;
}

module.exports.deleteTask = async function deleteTask(uid, taskId) {
    const removeResult = await db.removeFromFieldArray("users", uid, "tasks", taskId);
    if (!removeResult.success) {
        return { success: false, error: removeResult.error };
    }
    const deleteResult = await db.deleteSingleDoc("tasks", taskId);
    return deleteResult;
}

module.exports.toggleTaskCompletion = async function toggleTaskCompletion(uid, taskId, completed) {
  try {
    if (!taskId) {
      return { success: false, error: "Task ID is required" };
    }

    // Verify the task exists and belongs to the user
    const task = await db.queryDatabaseSingle(taskId, "tasks");
    
    // Better error handling for task not found
    if (!task.success) {
      console.error(`Task query failed: ${JSON.stringify(task)}`);
      return { success: false, error: "Failed to find task: " + (task.message || "Unknown error") };
    }
    
    if (!task.data) {
      console.error(`Task not found: ${taskId}`);
      return { success: false, error: "Task not found" };
    }
    
    // Verify task ownership (security check)
    if (task.data.uid !== uid) {
      console.error(`Task ownership mismatch. Task UID: ${task.data.uid}, User UID: ${uid}`);
      return { success: false, error: "You don't have permission to modify this task" };
    }

    // Update the completion status with improved error handling
    console.log(`Updating task ${taskId} completion status to ${completed}`);
    const update1 = await db.updateField("tasks", taskId, "completed", completed);
    
    if (!update1.success) {
      console.error(`Failed to update completion status: ${JSON.stringify(update1.error || "Unknown error")}`);
      return { 
        success: false, 
        error: "Failed to update task completion status: " + (update1.error?.message || "Database error") 
      };
    }
    
    // If marked as complete, set completedAt timestamp
    try {
      if (completed) {
        console.log(`Setting completedAt timestamp for task ${taskId}`);
        const update2 = await db.updateField("tasks", taskId, "completedAt", new Date().toISOString());
        if (!update2.success) {
          console.error(`Failed to update completedAt: ${JSON.stringify(update2.error || "Unknown error")}`);
          // We succeeded with the main update, so return success even if timestamp update fails
          return { success: true };
        }
        return { success: true };
      } else {
        // If marked as incomplete, remove completedAt
        console.log(`Clearing completedAt timestamp for task ${taskId}`);
        const update2 = await db.updateField("tasks", taskId, "completedAt", null);
        if (!update2.success) {
          console.error(`Failed to clear completedAt: ${JSON.stringify(update2.error || "Unknown error")}`);
          // We succeeded with the main update, so return success even if timestamp update fails
          return { success: true };
        }
        return { success: true };
      }
    } catch (timestampErr) {
      console.error(`Error updating timestamp: ${timestampErr}`);
      // Main update succeeded, so still return success
      return { success: true };
    }
  } catch (err) {
    console.error("Error toggling task completion:", err);
    return { 
      success: false, 
      error: (typeof err === 'object' && err !== null) ? (err.message || "Unknown error occurred") : String(err)
    };
  }
};

module.exports.getTaskHistory = async function getTaskHistory(uid, startDate, endDate, lastDoc) {
  try {
    // Verify user exists
    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return { success: false, error: "User not found" };
    }
    
    // Get all tasks for the user
    const tasksResult = await this.getUserTasks(uid);
    if (!tasksResult.success) {
      return { success: false, error: tasksResult.error || "Failed to fetch tasks" };
    }
    
    // Filter for completed tasks with completedAt field
    let completedTasks = tasksResult.data.filter(task => 
      task.completed && task.completedAt
    );
    
    // Apply date filtering if provided
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      completedTasks = completedTasks.filter(task => 
        new Date(task.completedAt).getTime() >= startDateTime
      );
    }
    
    if (endDate) {
      // Add one day to include the end date fully
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      completedTasks = completedTasks.filter(task => 
        new Date(task.completedAt).getTime() < endDateTime.getTime()
      );
    }
    
    // Sort by completedAt (newest first)
    completedTasks.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    
    // Apply pagination
    const pageSize = 10;
    let paginatedTasks = completedTasks;
    let nextLastDoc = null;
    
    if (lastDoc) {
      // Find the index of the last document
      const lastIndex = completedTasks.findIndex(task => task.id === lastDoc);
      if (lastIndex !== -1 && lastIndex + 1 < completedTasks.length) {
        paginatedTasks = completedTasks.slice(lastIndex + 1, lastIndex + 1 + pageSize);
        
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
    
    // Calculate streak data
    const streakData = calculateStreaks(completedTasks);
    
    return { 
      success: true, 
      data: {
        completions: paginatedTasks,
        lastDoc: nextLastDoc,
        streaks: streakData
      } 
    };
  } catch (err) {
    console.error("Error getting task history:", err);
    return { 
      success: false, 
      error: typeof err === 'object' ? (err.message || "Unknown error") : String(err)
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
      totalCompletions: 0
    };
  }
  
  // Sort by date (most recent first) for streak calculation
  const sortedByDate = [...completedTasks].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
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
    mostRecentDate.getDate()
  );
  
  // If most recent completion is from before yesterday, streak is 0
  if (mostRecentDay < yesterday) {
    currentStreak = 0;
  } else {
    // Count consecutive days with completions
    const dates = new Set();
    sortedByDate.forEach(task => {
      const date = new Date(task.completedAt);
      dates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });
    
    // Convert to array of Date objects
    const dateArray = Array.from(dates).map(dateString => {
      const [year, month, day] = dateString.split('-').map(Number);
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
        
        if (date.getFullYear() === expectedDate.getFullYear() &&
            date.getMonth() === expectedDate.getMonth() &&
            date.getDate() === expectedDate.getDate()) {
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
    const [year, month, day] = dateKey.split('-').map(Number);
    const currentDate = new Date(year, month, day);
    
    if (i === 0) {
      lastCompletionDate = currentDate;
      currentRunStreak = 1;
    } else {
      const dayDiff = Math.round((currentDate.getTime() - lastCompletionDate.getTime()) / (1000 * 3600 * 24));
      
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
  
  const completionsLast7Days = completedTasks.filter(task => 
    new Date(task.completedAt) >= sevenDaysAgo
  ).length;
  
  const completionsLast30Days = completedTasks.filter(task => 
    new Date(task.completedAt) >= thirtyDaysAgo
  ).length;
  
  return {
    currentStreak,
    longestStreak,
    completionsLast7Days,
    completionsLast30Days,
    totalCompletions: completedTasks.length
  };
}