import axios from "axios";

export default async function handler(req, res) {
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
          link: item.link
        });
      }
    }

    // Gemini AI
    const prompt = `
You are a smart shopping assistant.

Product: ${product}
Platforms: ${results.map(r => `${r.platform} (${r.price})`).join(", ")}

Give best deal recommendation.
`;

    let recommendation = "Best platform depends on availability and trust.";

    try {
      const aiRes = await axios.post(
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        {
          params: { key: process.env.GEMINI_API_KEY }
        }
      );

      recommendation =
        aiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || recommendation;
    } catch {}

    res.json({
      productName: product,
      results,
      recommendation
    });

  } catch (err) {
    res.status(500).json({ error: "API failed" });
  }
}
