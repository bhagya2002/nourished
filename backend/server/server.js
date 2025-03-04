const express = require("express");
const routes = require("./routes.js");
const app = express();
const port = 3010;
const cors = require('cors');

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
app.use(cors());
routes(app);
app.listen(port, () => {
  console.log(`Nourished backend listening on port ${port}`);
});
