import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// API Routes
app.post("/api/generate-workouts", async (req, res) => {
  const { periods } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    // 1. Generate the workout schedule using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a rowing workout schedule based on these training periods: ${JSON.stringify(periods)}. 
      For each day in each period, assign a workout intensity (UT2, UT1, AT, TR, AN) following the percentage distribution provided. 
      UT2: Aerobic Base (long, steady). UT1: Intensive Aerobic. AT: Threshold. TR: Transport. AN: Anaerobic.
      Make the schedule realistic (e.g., rest days, varying intensities).
      Return an array of objects: { date: "YYYY-MM-DD", intensity: "UT2", description: "Detailed workout description", durationMinutes: 60 }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              intensity: { type: Type.STRING },
              description: { type: Type.STRING },
              durationMinutes: { type: Type.NUMBER }
            },
            required: ["date", "intensity", "description", "durationMinutes"]
          }
        }
      }
    });

    const workouts = JSON.parse(response.text);
    res.json({ workouts });
  } catch (error) {
    console.error("Error generating workouts:", error);
    res.status(500).json({ error: "Failed to generate workouts" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
