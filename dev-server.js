// 🔥 MUST BE FIRST
import dotenv from "dotenv";
dotenv.config();

// After dotenv loads .env → you import everything else
import express from "express";
import analyse from "./api/analyse.js";
import buildPlan from "./api/build-plan.js";
import runWorkflow from "./api/run-workflow.js";

const app = express();
app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Local test working" });
});

// Wrap Vercel-style Edge handlers
app.post("/api/analyse", async (req, res) => {
  const response = await analyse({
    method: "POST",
    json: async () => req.body
  });
  res.send(await response.text());
});

app.post("/api/build-plan", async (req, res) => {
  const response = await buildPlan({
    method: "POST",
    json: async () => req.body
  });
  res.send(await response.text());
});

app.post("/api/run-workflow", async (req, res) => {
  const response = await runWorkflow({
    method: "POST",
    json: async () => req.body
  });
  res.send(await response.text());
});

app.listen(3000, () => {
  console.log("🔥 Dev server running → http://localhost:3000");
});
