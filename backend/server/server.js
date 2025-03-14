const express = require("express");
const routes = require("./routes.js");
const app = express();
const port = 3010;
const cors = require('cors');
const taskService = require("../services/taskService");

// Suppress punycode deprecation warning by using userland punycode instead
// This patches the warning while we continue to use dependencies that might rely on it
process.emitWarning = (function(originalEmitWarning) {
  return function(warning, ...args) {
    if (typeof warning === 'string' && warning.includes('punycode')) {
      return;
    }
    return originalEmitWarning.call(process, warning, ...args);
  };
})(process.emitWarning);

// TODO: Load any additional stuff
app.use(express.json());

// Set up CORS with more specific configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add a middleware to log requests (simplified)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

routes(app);

// Set up automated task reset scheduler
function setupTaskResetScheduler() {
  const runResetJob = async () => {
    console.log('Running scheduled task reset job...');
    try {
      const result = await taskService.resetRecurringTasks();
      if (result.success) {
        console.log(`Task reset job completed: ${result.message}`);
      } else {
        console.error(`Task reset job failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Error in task reset job:', err);
    }
    
    // Schedule the next run
    scheduleNextRun();
  };
  
  const scheduleNextRun = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    console.log(`Next task reset scheduled for midnight (${tomorrow.toISOString()}), in ${Math.round(timeUntilMidnight/1000/60)} minutes`);
    
    // Set timeout for next run
    setTimeout(runResetJob, timeUntilMidnight);
  };
  
  // Also run immediately when server starts to catch any tasks that should have been reset
  runResetJob();
}

app.listen(port, () => {
  console.log(`Nourished backend listening on port ${port}`);
  
  // Start the task reset scheduler
  setupTaskResetScheduler();
});
