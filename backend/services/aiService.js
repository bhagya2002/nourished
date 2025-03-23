const openai = require("openai");
const db = require("../firebase/firestore");
const taskService = require("./taskService")
const client = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const tipByUID = new Map();
const taskRecommendationByUID = new Map();

const apiPrompt = `You are a professional data scientist who specializes in looking at user data and 
providing personalized tips that help your users create and maintain healthy habits. 
You will be given json objects that contain a task title and an associated rating of their happiness that scales from
1 to 5. `
const promptReturn = `You will have to return a small (100 characters MAX) personalized tip for this user.When you give a tip, make it similar to the titles and descriptions of the inputted data.`
const idReturn = `You will have to return a singular taskId that will best help the user continue to be healthy. 
Make sure you select from the JSON field labelled 'taskID'. Return just the taskid, no extra explanation or reasoning.`

module.exports.AITips = async function AITips(uid) {
    const cacheCheck = getCachedResult(uid, 0);
    if (cacheCheck) {
        return { success: true, data: cacheCheck }
    }

    const happinessScores = JSON.stringify((await taskService.getHappinessData(uid)).data.ratings);

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: "system", content: apiPrompt + promptReturn },
            { role: "user", content: happinessScores }
        ],
        max_tokens: 100
    });
    const retVal = response.choices[0].message.content;
    tipByUID.set(uid, { date: new Date(), data: retVal });
    return { success: true, data: retVal };
}

module.exports.AITaskRecommendation = async function AITaskRecommendation(uid) {
    const cacheCheck = getCachedResult(uid, 1);
    if (cacheCheck) {
        return { success: true, data: cacheCheck }
    }
    const happinessScores = JSON.stringify((await taskService.getHappinessData(uid)).data.ratings);

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: "system", content: apiPrompt + idReturn },
            { role: "user", content: happinessScores }
        ],
        max_tokens: 50
    });

    const task = await db.queryDatabaseSingle(response.choices[0].message.content, "tasks");
    taskRecommendationByUID.set(uid, { date: new Date(), data: task });
    return { success: true, data: task };
}

function getCachedResult(uid, type) {
    let dataMap;
    if (type == 0) { // tips
        dataMap = tipByUID;
    } else if (type == 1) { // tasks
        dataMap = taskRecommendationByUID;
    }
    else return null;
    if (dataMap.has(uid)) {
        const entry = dataMap.get(uid);
        if (getDayDifference(entry.date, new Date()) == 0) {
            return entry.data;
        } else {
            return null;
        }
    }
}

function getDayDifference(first, second) {
    var one = new Date(first.getFullYear(), first.getMonth(), first.getDate());
    var two = new Date(second.getFullYear(), second.getMonth(), second.getDate());

    var millisecondsPerDay = 1000 * 60 * 60 * 24;
    var millisBetween = two.getTime() - one.getTime();
    var days = millisBetween / millisecondsPerDay;

    return Math.floor(days);
}