const db = require("../firebase/firestore");

/**
 * Submit a new mood entry for a user
 * @param {string} uid - The user ID
 * @param {number} rating - The mood rating (0-5)
 * @param {string} note - Optional note for the mood entry
 * @param {string} date - ISO date string
 * @returns {Promise<Object>} Result object
 */
async function submitMood(uid, rating, note, date) {
  try {
    if (
      (!rating && rating !== 0) ||
      rating < 0 ||
      rating > 5 ||
      !Number.isInteger(rating)
    ) {
      return {
        success: false,
        error: "Valid mood rating (0-5) is required",
      };
    }

    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) {
      return {
        success: false,
        error: "Invalid date format",
      };
    }

    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const moodIds = userResult.data.moods || [];
    if (moodIds.length > 0) {
      const moodsResult = await db.queryMultiple(moodIds, "moods");
      if (moodsResult.success && moodsResult.data.length > 0) {
        const currentDateStr = parsedDate.toISOString().split("T")[0];

        const existingMoodOnSameDay = moodsResult.data.find((mood) => {
          const moodDate = new Date(mood.date);
          const moodDateStr = moodDate.toISOString().split("T")[0];
          return moodDateStr === currentDateStr;
        });

        if (existingMoodOnSameDay) {
          console.log(
            `Found existing mood for date ${currentDateStr}, updating instead of creating new one`,
          );
          return await updateMood(
            uid,
            existingMoodOnSameDay.date,
            note,
            rating,
          );
        }
      }
    }

    const moodData = {
      uid,
      rating,
      note: note || "",
      date: parsedDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    const addResult = await db.addSingleDoc("moods", moodData);

    if (!addResult.success) {
      return {
        success: false,
        error: "Failed to save mood entry",
      };
    }

    const updateResult = await db.updateFieldArray(
      "users",
      uid,
      "moods",
      addResult.id,
    );

    if (!updateResult.success) {
      await db.deleteSingleDoc("moods", addResult.id);
      return {
        success: false,
        error: "Failed to update user with mood entry",
      };
    }

    return {
      success: true,
      data: { id: addResult.id },
    };
  } catch (error) {
    console.error("Error in submitMood service:", error);
    return {
      success: false,
      error: error.message || "Server error occurred",
    };
  }
}

/**
 * Get mood entries for a user
 * @param {string} uid - The user ID
 * @returns {Promise<Object>} Result object with mood data
 */
async function getUserMoodEntries(uid) {
  try {
    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const moodIds = userResult.data.moods || [];
    if (moodIds.length === 0) {
      return {
        success: true,
        data: { ratings: [] },
      };
    }

    const moodsResult = await db.queryMultiple(moodIds, "moods");
    if (!moodsResult.success) {
      return {
        success: false,
        error: "Failed to fetch mood entries",
      };
    }

    const sortedMoods = moodsResult.data.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    return {
      success: true,
      data: { ratings: sortedMoods },
    };
  } catch (error) {
    console.error("Error in getUserMoodEntries service:", error);
    return {
      success: false,
      error: error.message || "Server error occurred",
    };
  }
}

/**
 * Delete a mood entry for a user
 * @param {string} uid - The user ID
 * @param {string} date - The date of the mood entry to delete
 * @returns {Promise<Object>} Result object
 */
async function deleteMood(uid, date) {
  try {
    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const moodIds = userResult.data.moods || [];
    if (moodIds.length === 0) {
      return {
        success: false,
        error: "No mood entries found for this user",
      };
    }

    const moodsResult = await db.queryMultiple(moodIds, "moods");
    if (!moodsResult.success) {
      return {
        success: false,
        error: "Failed to fetch mood entries",
      };
    }

    const targetMood = moodsResult.data.find((mood) => {
      const moodDate = new Date(mood.date).toISOString().split("T")[0];
      const targetDate = new Date(date).toISOString().split("T")[0];
      return moodDate === targetDate;
    });

    if (!targetMood) {
      return {
        success: false,
        error: "Mood entry not found for the specified date",
      };
    }

    const deleteResult = await db.deleteSingleDoc("moods", targetMood.id);
    if (!deleteResult.success) {
      return {
        success: false,
        error: "Failed to delete mood entry",
      };
    }

    const updateResult = await db.removeFromFieldArray(
      "users",
      uid,
      "moods",
      targetMood.id,
    );

    if (!updateResult.success) {
      return {
        success: false,
        error: "Failed to update user after deleting mood entry",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in deleteMood service:", error);
    return {
      success: false,
      error: error.message || "Server error occurred",
    };
  }
}

/**
 * Update a mood entry for a user
 * @param {string} uid - The user ID
 * @param {string} date - The date of the mood entry to update
 * @param {string} note - The new note content
 * @param {number} [rating] - Optional new mood rating
 * @returns {Promise<Object>} Result object
 */
async function updateMood(uid, date, note, rating) {
  try {
    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const moodIds = userResult.data.moods || [];
    if (moodIds.length === 0) {
      return {
        success: false,
        error: "No mood entries found for this user",
      };
    }

    const moodsResult = await db.queryMultiple(moodIds, "moods");
    if (!moodsResult.success) {
      return {
        success: false,
        error: "Failed to fetch mood entries",
      };
    }

    const targetMood = moodsResult.data.find((mood) => {
      const moodDate = new Date(mood.date).toISOString().split("T")[0];
      const targetDate = new Date(date).toISOString().split("T")[0];
      return moodDate === targetDate;
    });

    if (!targetMood) {
      return {
        success: false,
        error: "Mood entry not found for the specified date",
      };
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (note !== undefined) {
      updateData.note = note || "";
    }

    if (rating !== undefined) {
      if (
        (rating === 0 || rating) &&
        rating >= 0 &&
        rating <= 5 &&
        Number.isInteger(rating)
      ) {
        updateData.rating = rating;
      } else if (rating !== undefined) {
        return {
          success: false,
          error: "Invalid rating provided. Must be an integer between 0 and 5.",
        };
      }
    }

    const updateResult = await db.updateSingleDoc(
      "moods",
      targetMood.id,
      updateData,
    );

    if (!updateResult.success) {
      return {
        success: false,
        error: "Failed to update mood entry",
      };
    }

    return {
      success: true,
      data: { id: targetMood.id },
    };
  } catch (error) {
    console.error("Error in updateMood service:", error);
    return {
      success: false,
      error: error.message || "Server error occurred",
    };
  }
}

module.exports = {
  submitMood,
  getUserMoodEntries,
  deleteMood,
  updateMood,
};
