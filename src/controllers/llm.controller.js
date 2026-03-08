import { summarizeText } from "../services/llm.service.js";

export const summarizeController = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Text is required"
      });
    }

    const cleaned = text.trim();

    if (cleaned.length < 50) {
      return res.status(400).json({
        message: "Text must be at least 50 characters"
      });
    }

    if (cleaned.length > 10000) {
      return res.status(413).json({
        message: "Text exceeds 10000 character limit"
      });
    }

    const result = await summarizeText(cleaned);

    return res.status(200).json(result);

  } catch (error) {

    console.error("LLM summarize error:", error);

    return res.status(502).json({
      message: "Failed to generate summary"
    });

  }
};