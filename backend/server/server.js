const express = require("express");
const routes = require("./routes.js");
const app = express();
const port = 3010;

// TODO: Load any additional stuff
app.use(express.json());
routes(app);
app.listen(port, () => {
  console.log(`Nourished backend listening on port ${port}`);
});
