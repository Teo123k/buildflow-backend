import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.get("/test", (req, res) => {
  res.json({ message: "API is working!" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on port ${PORT}`);
});
