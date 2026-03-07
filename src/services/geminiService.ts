import { GoogleGenAI, Type } from "@google/genai";

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 1. Image Analysis using gemini-3-pro-preview
export const analyzeFoodImage = async (file: File): Promise<{ title: string; tags: string[]; weightEstimate: number }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(file);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        },
        {
          text: "Analyze this food image for a donation platform. Extract a short title (max 5 words), relevant food type tags (e.g., Rice, Curry, Bread, Dessert, Veg, Non-Veg), and an estimated weight in kg (just the number). Return JSON."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          weightEstimate: { type: Type.NUMBER }
        },
        required: ["title", "tags", "weightEstimate"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

// 2. Image Editing using gemini-2.5-flash-image
export const editFoodImage = async (file: File, instruction: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(file);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        },
        {
          text: instruction,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// 3. Video Generation using veo-3.1-fast-generate-preview
export const generateImpactVideo = async (file: File): Promise<string> => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
       // @ts-ignore
       const hasKey = await window.aistudio.hasSelectedApiKey();
       if (!hasKey) {
          // @ts-ignore
           await window.aistudio.openSelectKey();
       }
    }

    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await fileToGenerativePart(file);

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: "Cinematic slow motion shot of this food being served, warm lighting, high quality, professional food photography style.",
            image: {
                imageBytes: base64Data,
                mimeType: file.type,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation failed");
        
        return `${videoUri}&key=${process.env.API_KEY}`;
    } catch (error: any) {
        if (error.message && error.message.includes("Requested entity was not found")) {
            // @ts-ignore
            if (window.aistudio && window.aistudio.openSelectKey) {
                // @ts-ignore
                await window.aistudio.openSelectKey();
                throw new Error("API Key session expired or invalid. Please select your key again and retry.");
            }
        }
        throw error;
    }
};


// 4. Maps Grounding using gemini-2.5-flash
export const findNearbyCharities = async (lat: number, lng: number): Promise<any[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Find 3 food banks or charities near this location that accept food donations. Return their names and addresses.",
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: lat,
                        longitude: lng
                    }
                }
            }
        }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const places = chunks?.filter((c: any) => c.web?.uri || c.entity?.name).map((c:any) => ({
        name: c.entity?.name || "Unknown Place",
        uri: c.web?.uri
    })) || [];

    return places;
}
