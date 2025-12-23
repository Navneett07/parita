console.log("### UPDATED SERVER FILE RUNNING ###");

const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

/* ---------------- GEMINI AI FUNCTION ---------------- */

async function getGeminiRecommendation(product, results) {
  const available = results
    .map(r => `${r.platform} (${r.price !== "N/A" ? r.price : "price not listed"})`)
    .join(", ");

  const prompt = `
You are an intelligent shopping assistant.

Product: ${product}

Available platforms: ${available}

If prices are not available, still recommend the best platform
based on brand reliability, availability, and customer trust.
Give a short recommendation.
`;

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("Gemini Error:", error.response?.data || error.message);
    return "Based on availability and trust, Amazon is generally the safest choice.";
  }
}

/* ---------------- ROUTES ---------------- */

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/api/search", async (req, res) => {
  const product = req.query.product;

  if (!product) {
    return res.status(400).json({ error: "Product name required" });
  }

  try {
    const sites = {
      Amazon: "amazon.in",
      Flipkart: "flipkart.com",
      Croma: "croma.com",
      Reliance: "reliancedigital.in"
    };

    const results = [];

    for (const platform in sites) {
      const query = `${product} site:${sites[platform]}`;

      const response = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
          params: {
            key: process.env.GOOGLE_API_KEY,
            cx: process.env.SEARCH_ENGINE_ID,
            q: query
          }
        }
      );

      const item = response.data.items?.[0];
      if (item) {
        const priceMatch = item.snippet.match(/₹\s?\d[\d,]*/);

        results.push({
          platform,
          price: priceMatch ? priceMatch[0] : "N/A",
          rating: "N/A",
          link: item.link
        });
      }
    }

    // 🔥 GEMINI AI CALL
    const aiRecommendation = await getGeminiRecommendation(product, results);

    res.json({
      productName: product,
      results,
      recommendation: aiRecommendation
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Google API error" });
  }
});

/* ---------------- SERVER START ---------------- */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
