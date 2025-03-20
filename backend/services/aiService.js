const openai = require("openai");
const db = require("../firebase/firestore");
const taskService = require("./taskService")
const client = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const apiPrompt = `You are a professional data scientist who specializes in looking at user data and 
providing personalized tips that help your users create and maintain healthy habits. 
You will be given json objects that contain a task title and an associated rating of their happiness that scales from
1 to 5. `
const promptReturn = `You will have to return a small (100 characters MAX) personalized tip for this user.When you give a tip, make it similar to the titles and descriptions of the inputted data.`
const idReturn = `You will have to return a singular taskId that will best help the user continue to be healthy. 
Make sure you select from the JSON field labelled 'taskID'. Return just the taskid, no extra explanation or reasoning.`

module.exports.AITips = async function AITips(uid) {
    const happinessScores = JSON.stringify((await taskService.getHappinessData(uid)).data.ratings);

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: "system", content: apiPrompt + promptReturn },
            { role: "user", content: happinessScores }
        ],
        max_tokens: 100
    });

    return { success: true, data: response.choices[0].message.content };
}

module.exports.AITaskRecommendation = async function AITaskRecommendation(uid) {
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
    return { success: true, data: task };
}
