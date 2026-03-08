import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "../config/env.js";

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

export const summarizeText = async (text) => {
  const model = genAI.getGenerativeModel({
    model: env.llmModel,
  });

  const prompt = `${env.llmSummarizePrompt}

TEXT:
${text}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const summary = response.text().trim();

  return {
    summary,
    model: env.llmModel,
  };
};