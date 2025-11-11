import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON bodies

// const ai = new GoogleGenAI({
//   apiKey: "AIzaSyBAx4c-8aRJvUri0vBTZCG6uKrpNdPzsE0",
// });

// Simple TextRank Extractive Summary
function textRankSummarize(text, maxSentences = 3) {
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
  if (sentences.length <= maxSentences) return sentences;

  const scored = sentences.map((sentence) => {
    const words = new Set(sentence.toLowerCase().split(/\W+/));
    return { sentence, score: words.size };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxSentences).map((s) => s.sentence.trim());
}

// Extract article
async function summarizeArticle(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      throw new Error("Failed to extract article text");
    }

    const summary = textRankSummarize(article.textContent, 3);
    return { title: article.title, extractive: summary };
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Abstractive AI summary
// async function abstractiveSummary(extractive) {
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: `Give an abstractive summary of this content:\n ${extractive}`,
//   });

//   return response.text;
// }

// ✅ POST API
app.post("/summarize", async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const result = await summarizeArticle(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Error summarizing URL" });
  }
});
app.listen(3000, () => console.log("✅ Server running on port 3000"));
