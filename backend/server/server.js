const express = require("express");
const routes = require("./routes.js");
const cors = require("cors");
const taskService = require("../services/taskService.js");

const app = express();
const port = process.env.PORT || 3010;

// Suppress punycode deprecation warning
process.emitWarning = (function (originalEmitWarning) {
  return function (warning, ...args) {
    if (typeof warning === "string" && warning.includes("punycode")) {
      return;
    }
    return originalEmitWarning.call(process, warning, ...args);
  };
})(process.emitWarning);

// Middleware
app.use(express.json());

// Set up CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check route
app.get("/", (req, res) => {
  res.send("Server is running on Vercel!");
});

// Load routes - this needs to be outside any conditional blocks
routes(app);

// Task scheduler function - only run in local development
function setupTaskResetScheduler() {
  // Your existing scheduler code
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
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    console.log(
      `Next task reset scheduled for midnight (${tomorrow.toISOString()}), in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`,
    );

    setTimeout(runResetJob, timeUntilMidnight);
  };

  runResetJob(); // Run immediately on startup
}

// Only start the server and scheduler for local development
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Local backend listening on port ${port}`);
    setupTaskResetScheduler();
  });
} else {
  // For serverless environments, just log that we're ready
  console.log("Serverless environment: Express routes registered");
}

// Export app for Vercel deployment
module.exports = app;
