// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./models");
const cookieParser = require("cookie-parser");
const app = express();
const { swaggerUi, swaggerSpec } = require("./swagger");
const { initializeBucket } = require("./services/MinIOService");
const https = require("https");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", require("./routes"));

(async () => {
  await initializeBucket(); //Just for the first time
})();

const sslOptions = {
  key: fs.readFileSync("./ssl/key.pem"),
  cert: fs.readFileSync("./ssl/cert.pem"),
};

db.sequelize
  .sync({ alter: false })
  // .authenticate()
  .then(async () => {
    console.log("Database synchronized and models updated successfully.");
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error synchronizing the database:", error);
  });
