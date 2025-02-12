const express = require("express");
const bodyparser = require("body-parser");
const routes = require("./routes.js");
const app = express();
const port = 3000;

// TODO: Load any additional stuff
app.use(express.json());
routes(app);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
