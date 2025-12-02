import express from "express";
import { supabase } from "../lib/supabaseClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, description, data } = req.body;

    if (!name || !data) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const { data: flow, error } = await supabase
      .from("flows")
      .insert([
        {
          name,
          description: description || "",
          data,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to save flow." });
    }

    return res.status(200).json({ success: true, flow });
  } catch (err) {
    console.error("Server error saving flow:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

