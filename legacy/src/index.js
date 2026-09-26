require("dotenv").config();

const swaggerUI = require("swagger-ui-express");
const cors = require("cors");
const express = require("express");
const router = require("./routes/route");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", router);
app.use("/docs", swaggerUI.serve, swaggerUI.setup(require("../swagger.json")));

async function start() {
  const { initializeDb } = await import("../../packages/db/dist/init.js");
  const db = await initializeDb(process.env);
  const server = app.listen(process.env.PORT || 5000);

  const shutdown = async () => {
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
