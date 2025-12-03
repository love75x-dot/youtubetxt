import { GoogleGenAI, Type } from "@google/genai";
import { ScriptAnalysis, TopicRecommendation } from "../types";

// Helper to get API key from multiple sources
const getApiKey = (): string => {
  // Try environment variable first
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'your_api_key_here') {
    return envKey;
  }
  
  // Try localStorage
  const savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    return savedKey;
  }
  
  throw new Error("API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file or enter it in the app");
};

// Helper to ensure we have a key (though app structure guarantees it via environment usually)
const getAI = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

export const analyzeScript = async (scriptText: string): Promise<ScriptAnalysis> => {
  const ai = getAI();
  
  const prompt = `
    Analyze the following YouTube script text. 
    Identify the tone, target audience, pacing, key themes, strengths, and writing style.
    Return the result in Korean.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: prompt },
      { text: scriptText }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tone: { type: Type.STRING, description: "The overall mood (e.g., Humorous, Serious, Educational)" },
          targetAudience: { type: Type.STRING, description: "Who this video is for" },
          pacing: { type: Type.STRING, description: "Speed of delivery (Fast, Moderate, Slow)" },
          keyThemes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Main topics covered" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What makes this script good" },
          writingStyle: { type: Type.STRING, description: "Description of the writing style (e.g., First-person narrative, Data-driven)" }
        },
        required: ["tone", "targetAudience", "pacing", "keyThemes", "strengths", "writingStyle"]
      }
    }
  });

  if (!response.text) throw new Error("No analysis returned");
  return JSON.parse(response.text) as ScriptAnalysis;
};

export const generateTopics = async (analysis: ScriptAnalysis, count: number = 4): Promise<TopicRecommendation[]> => {
  const ai = getAI();

  const prompt = `
    Based on the following script analysis, suggest ${count} new, high-potential YouTube video topics.
    The topics should appeal to the same audience and maintain the identified style but cover fresh ground.
    Provide the output in Korean.
    
    Analysis Context:
    Tone: ${analysis.tone}
    Audience: ${analysis.targetAudience}
    Themes: ${analysis.keyThemes.join(", ")}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Catchy YouTube title" },
            premise: { type: Type.STRING, description: "One sentence summary of the video idea" },
            reason: { type: Type.STRING, description: "Why this topic fits the channel" },
            viralityScore: { type: Type.NUMBER, description: "Predicted potential score out of 100" }
          },
          required: ["title", "premise", "reason", "viralityScore"]
        }
      }
    }
  });

  if (!response.text) throw new Error("No topics returned");
  return JSON.parse(response.text) as TopicRecommendation[];
};

export const writeNewScript = async (topic: TopicRecommendation, analysis: ScriptAnalysis): Promise<string> => {
  const ai = getAI();

  const prompt = `
    Write a complete YouTube video script for the topic: "${topic.title}".
    
    Constraint:
    1. Mimic the writing style, tone, and pacing found in the analysis.
    2. Target Audience: ${analysis.targetAudience}.
    3. Writing Style: ${analysis.writingStyle}.
    4. Structure: Hook (0-60s), Intro, Body (3-4 key points), Conclusion/CTA.
    5. Language: Korean.
    6. Include formatting like [Visual Cue], [Sound Effect], (Host speaking).
    
    Topic Premise: ${topic.premise}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    // We want free-form Markdown text for the script, not JSON
  });

  if (!response.text) throw new Error("No script generated");
  return response.text;
};
