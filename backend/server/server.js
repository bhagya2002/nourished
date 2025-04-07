const express = require("express");
const routes = require("./routes.js");
const cors = require("cors");
const taskService = require("../services/taskService.js");

const app = express();
const port = process.env.PORT || 3010;

process.emitWarning = (function (originalEmitWarning) {
  return function (warning, ...args) {
    if (typeof warning === "string" && warning.includes("punycode")) {
      return;
    }
    return originalEmitWarning.call(process, warning, ...args);
  };
})(process.emitWarning);

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Server is running on Vercel!");
});

routes(app);

function setupTaskResetScheduler() {
  const runResetJob = async () => {
    console.log("Running scheduled task reset job...");
    try {
      const result = await taskService.resetRecurringTasks();
      if (result.success) {
        console.log(`Task reset job completed: ${result.message}`);
      } else {
        console.error(`Task reset job failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Error in task reset job:", err);
    }

    scheduleNextRun();
  };

  const scheduleNextRun = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    console.log(
      `Next task reset scheduled for midnight (${tomorrow.toISOString()}), in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`,
    );

    setTimeout(runResetJob, timeUntilMidnight);
  };

  runResetJob();
}

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Local backend listening on port ${port}`);
    setupTaskResetScheduler();
  });
} else {
  console.log("Serverless environment: Express routes registered");
}

module.exports = app;
