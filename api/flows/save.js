import { supabase } from "../../lib/supabaseClient.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

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
      console.error(error);
      return res.status(500).json({ error: "Failed to save flow." });
    }

    return res.status(200).json({ success: true, flow });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
