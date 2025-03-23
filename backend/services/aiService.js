const openai = require("openai");
const db = require("../firebase/firestore");
const taskService = require("./taskService")


const client = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const tipByUID = new Map();
const taskRecommendationByUID = new Map();

// Task recommendation prompt
const taskRecommendationPrompt = `You are an AI wellness coach specializing in personalized task recommendations. 
Your role is to analyze a user's task history and happiness ratings to suggest new, personalized tasks that will help them maintain and improve their wellbeing.

The user data will be provided as JSON objects containing task titles and associated happiness ratings (scale 1-5).
Based on this data, you should:
1. Identify patterns in what types of tasks make the user happiest
2. Consider the frequency and nature of tasks they consistently complete
3. Suggest new tasks that align with their interests and have brought them joy

IMPORTANT: Return ONLY a raw JSON object without any markdown formatting or backticks. The response must be a valid JSON object with this exact structure:
{
    "title": "Brief, actionable task title",
    "description": "Clear, motivating description of how to complete the task",
    "frequency": "Daily|Weekly|Monthly"
}

Keep titles under 50 characters and descriptions under 200 characters.
Focus on practical, achievable tasks that build on the user's positive patterns.`;

// Daily tip prompt
const dailyTipPrompt = `You are an AI wellness coach specializing in personalized daily wellness tips.
Your role is to analyze a user's happiness data and task patterns to provide an encouraging, thoughtful tip that will help them improve their wellbeing today.

The user data will be provided as JSON objects containing task titles and happiness ratings (scale 1-5).
Based on this data:
1. Identify patterns in what activities or tasks appear to bring the user joy
2. Look for areas where the user might benefit from guidance
3. Consider the overall wellness journey reflected in their data

Provide a personalized, specific daily wellness tip that is:
- Concise but impactful (1-2 sentences)
- Actionable today
- Encouraging and positive in tone
- Rooted in evidence-based wellness practices
- Relevant to the patterns in their data

If you don't have enough data, provide a thoughtful, general wellness tip drawing on established wellbeing principles.

IMPORTANT: Return ONLY a raw JSON object without any markdown formatting or backticks. The response must be a valid JSON object with this exact structure:
{
    "title": "Brief, impactful tip title",
    "description": "A thoughtful, personalized explanation with specific guidance"
}`;


/**
 * Legacy function name for backward compatibility that now directly calls getWellnessTip
 * @param {string} uid - User ID
 * @returns {Object} Result from getWellnessTip
 */
module.exports.AITips = async function AITips(uid) {
    const cacheCheck = getCachedResult(uid, 0);
    if (cacheCheck) {
        return { success: true, message: cacheCheck }
    }

    // Call the newer implementation
    return module.exports.getWellnessTip(uid);
}

/**
 * Generates a personalized task recommendation based on user happiness data
 * @param {string} uid - User ID
 * @returns {Object} Result object with the recommended task
 */
module.exports.getTaskRecommendation = async function getTaskRecommendation(uid) {
    try {
        console.log("getTaskRecommendation called for uid:", uid);
        
        // Check cache first
        const cacheCheck = getCachedResult(uid, 1);
        if (cacheCheck) {
            return { success: true, message: cacheCheck }
        }
        
        const happinessData = await taskService.getHappinessData(uid);
        
        if (!happinessData.success || !happinessData.data || !happinessData.data.ratings) {
            return { success: false, error: "No happiness data found" };
        }

        const happinessScores = JSON.stringify(happinessData.data.ratings);
        
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: "system", content: taskRecommendationPrompt },
                { role: "user", content: `Based on this user's happiness data, suggest a personalized task: ${happinessScores}` }
            ],
            max_tokens: 200,
            temperature: 0.7
        });

        const suggestion = response.choices[0].message.content;
        
        try {
            // Try to parse the response as JSON
            const parsedSuggestion = JSON.parse(suggestion);
            // Store in cache
            taskRecommendationByUID.set(uid, { date: new Date(), data: parsedSuggestion });
            return { 
                success: true, 
                message: parsedSuggestion
            };
        } catch (e) {
            console.error("Failed to parse AI response as JSON");
            return { 
                success: false, 
                error: "Invalid AI response format" 
            };
        }
    } catch (error) {
        console.error("Error in getTaskRecommendation:", error.message);
        return { 
            success: false, 
            error: error.message || "Failed to generate task recommendation" 
        };
    }
}

/**
 * Generates a personalized daily wellness tip based on user data
 * @param {string} uid - User ID
 * @returns {Object} Result object with the wellness tip
 */
module.exports.getWellnessTip = async function getWellnessTip(uid) {
    try {
        console.log("getWellnessTip called for uid:", uid);
        
        // Check cache first
        const cacheCheck = getCachedResult(uid, 0);
        if (cacheCheck) {
            return { success: true, message: cacheCheck }
        }
        
        // Get user's happiness data and task history for personalization
        const happinessData = await taskService.getHappinessData(uid);
        const taskHistory = await taskService.getTaskHistory(uid);
        
        let userData = {};
        let hasSufficientData = false;
        
        // Check if we have enough data for personalization
        if (happinessData.success && happinessData.data && happinessData.data.ratings && 
            happinessData.data.ratings.length > 0) {
            userData.happiness = happinessData.data.ratings;
            hasSufficientData = true;
        }
        
        if (taskHistory.success && taskHistory.data && taskHistory.data.completions &&
            taskHistory.data.completions.length > 0) {
            userData.tasks = taskHistory.data.completions;
            hasSufficientData = true;
        }
        
        // Prepare the user data for the AI
        const userDataString = JSON.stringify(userData);
        
        // Get tip from AI
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: "system", content: dailyTipPrompt },
                { role: "user", content: hasSufficientData 
                    ? `Based on this user's data, provide a personalized daily wellness tip: ${userDataString}`
                    : `Provide a thoughtful general wellness tip for a user with limited history.`
                }
            ],
            max_tokens: 200,
            temperature: 0.7
        });
        
        const tipContent = response.choices[0].message.content;
        
        try {
            // Parse the JSON response
            const parsedTip = JSON.parse(tipContent);
            // Store in cache
            tipByUID.set(uid, { date: new Date(), data: parsedTip });
            return {
                success: true,
                message: parsedTip
            };
        } catch (e) {
            console.error("Failed to parse AI tip response as JSON");
            
            // If parsing fails, return a simple format with the raw content
            const fallbackTip = {
                title: "Daily Wellness Tip",
                description: tipContent.replace(/```json|```/g, '').trim()
            };
            
            // Store fallback in cache
            tipByUID.set(uid, { date: new Date(), data: fallbackTip });
            
            return {
                success: true,
                message: fallbackTip
            };
        }
    } catch (error) {
        console.error("Error in getWellnessTip:", error.message);
        return {
            success: false,
            error: error.message || "Failed to generate wellness tip"
        };
    }
};

/**
 * Legacy function name for backward compatibility that now directly calls getTaskRecommendation
 * @param {string} uid - User ID
 * @returns {Object} Result from getTaskRecommendation
 */
module.exports.AITaskRecommendation = async function AITaskRecommendation(uid) {
    const cacheCheck = getCachedResult(uid, 1);
    if (cacheCheck) {
        return { success: true, message: cacheCheck }
    }
    
    // Call the newer implementation
    return module.exports.getTaskRecommendation(uid);
}

function getCachedResult(uid, type) {
    const cache = type === 0 ? tipByUID : taskRecommendationByUID;
    const cacheLookup = cache.get(uid);
    if (cacheLookup && getDayDifference(new Date(cacheLookup.date), new Date()) < 1) {
        return cacheLookup.data;
    }
    return null;
}

function getDayDifference(first, second) {
    return Math.round((second - first) / (1000 * 60 * 60 * 24));
}
