import fetch from "node-fetch";
import express from "express";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import fs from "fs";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
const app = express();
app.use(cors());
app.use(express.json());
/**
 * Very simple extractive TextRank:
 * 1. Split into sentences
 * 2. Score by sentence length & distinct word count
 * 3. Pick top N sentences
 */

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

async function summarizeArticle(url) {
  try {
    // Fetch raw HTML
    const res = await fetch(url);
    const html = await res.text();

    // Parse into DOM
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      throw new Error("Could not extract readable text from article");
    }

    const summary = textRankSummarize(article.textContent, 3);

    return {
      url,
      title: article.title,
      summary,
    };
  } catch (err) {
    console.error("Summarization error:", err);
    return null;
  }
}

// Example usage:
async function fetchnews() {
  const url =
    "https://www.thehindu.com/news/national/state-must-show-manifest-transparency-fairness-in-issues-of-religious-oppression-sc-judge-observes/article70259579.ece?utm_source=newsshowcase&utm_medium=gnews&utm_campaign=CDAqEAgAKgcICjCJiv4KMPWIigMwttqBAw&utm_content=rundown&gaa_at=la&gaa_n=AWEtsqcZ1-qL1BG3BfWZjjSgS_3BFYd868_Oo1gpA-FBw7czLJ2BPDlMwZf6Km-JbIEjBeJLkD3oSv3V2azC&gaa_ts=69122f96&gaa_sig=4i4cA2zg3vtOzJ-pZCcnsSPAwoA1pEs4SlYbuO-zUjGynINnVRenOBsIyQfEMaEB5Us9ygy0pc0LsJNBF8mQMg%3D%3D";
  let extsum = await summarizeArticle(url);
  let data = JSON.stringify(extsum.summary);
  // text(extsum);
  console.log(extsum);
  fs.appendFile("new.txt", data, () => {});
}
fetchnews();
//abstractive summarisation part begins//

// const ai = new GoogleGenAI({
//   apiKey: "AIzaSyBAx4c-8aRJvUri0vBTZCG6uKrpNdPzsE0",
// });

// async function text(extsum) {
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: `give abstractive summary of this extractive summary ${extsum} `,
//   });
//   console.log(response.text);
//   const result = response.text;
//   fs.appendFile("new.txt", result, () => {});
// }
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

app.listen(3000, () => console.log("server running"));
