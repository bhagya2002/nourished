const db = require("../firebase/firestore");

// Simple in-memory cache for tasks
const taskCache = {};
const historyCache = {};
const HISTORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

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
        return { success: true, data: { id: taskResult.id } };
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
    console.time('getUserTasks');
    try {
        // Check if we have a cached version (add simple in-memory caching)
        const cacheKey = `tasks_${uid}`;
        if (taskCache[cacheKey] && taskCache[cacheKey].expiry > Date.now()) {
            console.timeEnd('getUserTasks');
            return taskCache[cacheKey].data;
        }
        
        // Use queryDatabase helper function instead of direct db access
        const tasksResult = await db.queryDatabase(uid, "tasks", "uid");
        
        if (!tasksResult.success) {
            console.timeEnd('getUserTasks');
            return { success: false, error: tasksResult.error || "Failed to query tasks" };
        }
        
        if (!tasksResult.data || tasksResult.data.length === 0) {
            console.timeEnd('getUserTasks');
            // Cache empty result for 30 seconds
            taskCache[cacheKey] = {
                data: { success: true, data: [] },
                expiry: Date.now() + 30000 // 30 second cache
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
        
        // Cache for 30 seconds
        taskCache[cacheKey] = {
            data: result,
            expiry: Date.now() + 30000 // 30 second cache
        };
        
        console.timeEnd('getUserTasks');
        return result;
    } catch (err) {
        console.timeEnd('getUserTasks');
        console.error("Error in getUserTasks:", err);
        return { success: false, error: typeof err === 'object' ? (err.message || "Unknown error") : String(err) };
    }
};

module.exports.getGoalTasks = async function getGoalTasks(goalId) {
    const result = await db.queryDatabaseSingle(goalId, "goals");
    if (result.success) {
        return await db.queryMultiple(result.data.taskIds, "tasks");
    } else return result;
}

module.exports.deleteTask = async function deleteTask(uid, taskId, goalId) {
    const removeResult = await db.removeFromFieldArray("users", uid, "tasks", taskId);
    if (!removeResult.success) {
        return { success: false, error: removeResult.error };
    }
    if (goalId) {
        await db.removeFromFieldArray("goals", goalId, "taskIds", taskId);
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
                
                // Clear the history cache for this user to ensure fresh data on next request
                clearHistoryCache(uid);
                
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
                
                // Clear the history cache for this user
                clearHistoryCache(uid);
                
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

// Helper function to clear history cache for a user
function clearHistoryCache(uid) {
    if (historyCache[uid]) {
        console.log(`Clearing history cache for user ${uid}`);
        delete historyCache[uid];
    }
}

// Helper function to get cache key for history
function getHistoryCacheKey(uid, startDate, endDate) {
    return `${uid}:${startDate || ""}:${endDate || ""}`;
}

module.exports.getTaskHistory = async function getTaskHistory(uid, startDate, endDate, lastDoc) {
    try {
        const cacheKey = getHistoryCacheKey(uid, startDate, endDate);
        
        // Check if we have a valid cache entry for this query
        if (!lastDoc && historyCache[cacheKey] && historyCache[cacheKey].timestamp > Date.now() - HISTORY_CACHE_TTL) {
            console.log(`Using cached task history for ${cacheKey}`);
            
            // Apply pagination if lastDoc provided
            const cachedResults = historyCache[cacheKey].data;
            
            return {
                success: true,
                data: cachedResults
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
        
        // Create full result set for caching
        const fullResults = {
            completions: completedTasks,
            streaks: calculateStreaks(completedTasks)
        };
        
        // Cache the full results (not paginated)
        if (!lastDoc) {
            historyCache[cacheKey] = {
                timestamp: Date.now(),
                data: fullResults
            };
        }
        
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
        
        // Prepare paginated response
        const paginatedResults = {
            completions: paginatedTasks,
            lastDoc: nextLastDoc,
            streaks: fullResults.streaks
        };
        
        return { 
            success: true, 
            data: paginatedResults
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

/**
 * Submit a happiness rating for a completed task
 * @param {string} uid - User ID
 * @param {string} taskId - Task ID
 * @param {number} rating - Happiness rating (1-5)
 * @param {string} date - ISO date string when the rating was submitted
 * @returns {Object} Result object with success flag
 */
module.exports.submitHappinessRating = async function submitHappinessRating(uid, taskId, rating, date) {
    try {
        // Validate inputs
        if (!uid || !taskId) {
            return { success: false, error: "User ID and Task ID are required" };
        }
        
        if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return { success: false, error: "Valid happiness rating (1-5) is required" };
        }
        
        // Ensure the task exists and belongs to the user
        const task = await db.queryDatabaseSingle(taskId, "tasks");
        if (!task.success || !task.data) {
            return { success: false, error: "Task not found" };
        }
        
        if (task.data.uid !== uid) {
            return { success: false, error: "You don't have permission to rate this task" };
        }
        
        // Verify the task is completed
        if (!task.data.completed) {
            return { success: false, error: "Cannot rate an incomplete task" };
        }
        
        // Check for duplicate rating (same task, same day)
        const existingRatings = await db.queryDatabase(uid, "happiness", "uid");
        
        if (existingRatings.success && existingRatings.data && existingRatings.data.length > 0) {
            const today = new Date(date).toISOString().split('T')[0]; // Get YYYY-MM-DD part
            
            const duplicateRating = existingRatings.data.find(rating => {
                // Same task and same day
                const ratingDate = new Date(rating.date).toISOString().split('T')[0];
                return rating.taskId === taskId && ratingDate === today;
            });
            
            if (duplicateRating) {
                // Update existing rating instead of creating a new one
                const updateResult = await db.updateField("happiness", duplicateRating.id, "rating", rating);
                if (!updateResult.success) {
                    return { success: false, error: "Failed to update existing happiness rating" };
                }
                return { success: true, data: { id: duplicateRating.id, updated: true } };
            }
        }
        
        // Create a new happiness rating document
        const happinessData = {
            uid,
            taskId,
            taskTitle: task.data.title || '',
            rating,
            date,
            createdAt: new Date().toISOString()
        };
        
        // Add to happiness collection
        const addResult = await db.addSingleDoc("happiness", happinessData);
        
        if (!addResult.success) {
            return { success: false, error: "Failed to save happiness rating" };
        }
        
        // Add the rating ID to the user's happiness array
        const updateResult = await db.updateFieldArray("users", uid, "happiness", addResult.id);
        
        if (!updateResult.success) {
            // Clean up the orphaned happiness document
            await db.deleteSingleDoc("happiness", addResult.id);
            return { success: false, error: "Failed to update user with happiness rating" };
        }
        
        return { success: true, data: { id: addResult.id, updated: false } };
        
    } catch (error) {
        console.error("Error in submitHappinessRating:", error);
        return { 
            success: false, 
            error: typeof error === 'object' ? error.message : String(error) 
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
module.exports.getHappinessData = async function getHappinessData(uid, startDate, endDate) {
    try {
        // Validate user
        const userResult = await db.queryDatabaseSingle(uid, "users");
        if (!userResult.success) {
            return { success: false, error: "User not found" };
        }
        
        // Get all happiness ratings for the user
        const happinessResult = await db.queryDatabase(uid, "happiness", "uid");
        
        if (!happinessResult.success) {
            return { success: false, error: happinessResult.error || "Failed to fetch happiness data" };
        }
        
        let happinessData = happinessResult.data || [];
        
        // Apply date filtering if provided
        if (startDate) {
            const startDateTime = new Date(startDate).getTime();
            happinessData = happinessData.filter(item => 
                new Date(item.date).getTime() >= startDateTime
            );
        }
        
        if (endDate) {
            // Add one day to include the end date fully
            const endDateTime = new Date(endDate);
            endDateTime.setDate(endDateTime.getDate() + 1);
            
            happinessData = happinessData.filter(item => 
                new Date(item.date).getTime() < endDateTime.getTime()
            );
        }
        
        // Sort by date (newest first)
        happinessData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
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
                count: happinessData.length
            }
        };
        
    } catch (error) {
        console.error("Error in getHappinessData:", error);
        return { 
            success: false, 
            error: typeof error === 'object' ? error.message : String(error) 
        };
    }
};

module.exports.resetRecurringTasks = async function resetRecurringTasks() {
    try {
        console.log('Starting scheduled task reset check...');
        
        // Get all completed tasks with frequencies
        const completedTasksResult = await db.queryDatabaseCustom("tasks", [
            ["completed", "==", true],
            ["frequency", "in", ["Daily", "Weekly", "Monthly"]]
        ]);
        
        if (!completedTasksResult.success || !completedTasksResult.data) {
            console.error("Failed to fetch completed recurring tasks:", completedTasksResult.error);
            return { success: false, error: "Failed to fetch tasks for reset" };
        }
        
        const tasksToReset = [];
        const now = new Date();
        
        // Determine which tasks need to be reset
        for (const task of completedTasksResult.data) {
            if (!task.completedAt) continue; // Skip if no completion date
            
            const completedDate = new Date(task.completedAt);
            let shouldReset = false;
            
            switch (task.frequency) {
                case "Daily":
                    // Reset if completed before today
                    shouldReset = completedDate.getDate() !== now.getDate() || 
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
                    shouldReset = completedDate.getMonth() !== now.getMonth() ||
                                  completedDate.getFullYear() !== now.getFullYear();
                    break;
            }
            
            if (shouldReset) {
                tasksToReset.push(task.id);
                console.log(`Task ${task.id} (${task.title}) - ${task.frequency} will be reset from completed state`);
            }
        }
        
        // Reset tasks that need to be reset
        const resetResults = [];
        for (const taskId of tasksToReset) {
            try {
                // Reset to incomplete and clear completedAt
                const updateResult = await db.updateField("tasks", taskId, "completed", false);
                if (updateResult.success) {
                    await db.updateField("tasks", taskId, "completedAt", null);
                    resetResults.push({ taskId, success: true });
                } else {
                    resetResults.push({ taskId, success: false, error: updateResult.error });
                }
            } catch (resetErr) {
                console.error(`Error resetting task ${taskId}:`, resetErr);
                resetResults.push({ taskId, success: false, error: resetErr.message });
            }
        }
        
        console.log(`Completed task reset check. Reset ${tasksToReset.length} tasks.`);
        return { 
            success: true, 
            message: `Reset ${tasksToReset.length} recurring tasks`,
            data: { tasksReset: tasksToReset.length, details: resetResults }
        };
    } catch (err) {
        console.error("Error in resetRecurringTasks:", err);
        return { 
            success: false, 
            error: typeof err === 'object' ? (err.message || "Unknown error") : String(err) 
        };
    }
};