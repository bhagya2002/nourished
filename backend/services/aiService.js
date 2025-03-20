const openai = require("openai");
const taskService = require("./taskService")
const client = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const apiPrompt = `You are a professional data scientist who specializes in looking at user data and 
providing personalized tips that help your users create and maintain healthy habits. 
You will be given json objects that contain a task title and an associated rating of their happiness that scales from
1 to 5.`
const promptReturn = `You will have to return a small (100 characters MAX) personalized tip for this user.`
const idReturn = `You will have to return a singular taskId that will best help the user continue to be healthy.`


module.exports.AITips = async function AITips(uid) {
    const happinessScores = JSON.stringify((await taskService.getHappinessData(uid)).data.ratings);
    const list = await client.models.list();

    for await (const model of list) {
        console.log(model);
    }
    const response = await client.responses.create({
        model: 'gpt-4o-mini',
        instructions: apiPrompt + promptReturn,
        input: happinessScores,
    });
    return response;
}


module.exports.AITaskRecommendation = async function AITaskRecommendation(uid) {
    const happinessScores = JSON.stringify((await taskService.getHappinessData(uid)).data.ratings);
    const response = await client.responses.create({
        model: 'gpt-4o-mini-2024-07-18',
        instructions: apiPrompt + idReturn,
        input: happinessScores,
    });
    return response;
}