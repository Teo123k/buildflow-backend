import dotenv from "dotenv";
dotenv.config();
import express from "express";
import analyse from "./api/analyse.js";
import buildPlan from "./api/build-plan.js";
import runWorkflow from "./api/run-workflow.js";

const app = express();
app.use(express.json());

// Wrap your Vercel-style handlers for local testing
app.post("/api/analyse", (req, res) =>
  analyse(req).then(r => r.text()).then(data => res.send(data))
);

app.post("/api/build-plan", (req, res) =>
  buildPlan(req).then(r => r.text()).then(data => res.send(data))
);

app.post("/api/run-workflow", (req, res) =>
  runWorkflow(req).then(r => r.text()).then(data => res.send(data))
);

app.get("/api/test", (req, res) =>
  res.json({ success: true, message: "Local test working" })
);

app.listen(3000, () => {
  console.log("Local dev server running at http://localhost:3000");
});
