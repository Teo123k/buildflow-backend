import express from "express";
import dotenv from "dotenv";
import saveFlowRouter from "./save-flow.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/test", (req, res) => {
  res.json({ message: "API is working!" });
});

app.use("/save-flow", saveFlowRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on port ${PORT}`);
});
