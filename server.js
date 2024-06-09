const express = require("express");
const app = express();
const db = require("./db.js");

require("dotenv").config();
const bodyParser = require("body-parser");

app.use(bodyParser.json());
const port = process.env.PORT || 8000;

//Import the router files
const userRoutes = require("./routes/userRoutes.js");

//use the routers
app.use("/user", userRoutes);

app.listen(port, () => {
  console.log(`server listening on ${port}`);
});
