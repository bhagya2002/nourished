const express = require("express");
const routes = require("./routes.js");
const app = express();
const port = 3010;
const cors = require('cors');

// TODO: Load any additional stuff
app.use(express.json());
app.use(cors());
routes(app);
app.listen(port, () => {
  console.log(`Nourished backend listening on port ${port}`);
});
