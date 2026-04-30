import { GoogleGenAI, Type } from "@google/genai";

// Get API key from Vite environment
const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not found");
  }
  return key;
};

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

// 1. Image Analysis using gemini-2.0-flash
export const analyzeFoodImage = async (file: File): Promise<{ title: string; tags: string[]; weightEstimate: number }> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await fileToGenerativePart(file);

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
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

// 2. Image Editing using gemini-2.0-flash
export const editFoodImage = async (file: File, instruction: string): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await fileToGenerativePart(file);

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
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
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
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
        
        return `${videoUri}&key=${apiKey}`;
    } catch (error: any) {
        throw error;
    }
};


// 4. Maps Grounding using gemini-2.0-flash
export const findNearbyCharities = async (lat: number, lng: number): Promise<any[]> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
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
};

// 5. Calculate Waste Impact Score
export const calculateWasteImpactScore = async (
  foodType: string,
  weight: number,
  tags: string[]
): Promise<{ score: number; impact: string; co2Saved: number; waterSaved: number }> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Calculate environmental impact score for a food donation with these details:
- Food Type: ${foodType}
- Weight: ${weight} kg
- Tags: ${tags.join(", ")}

Return JSON with:
1. score: 0-100 impact score (higher is better for environment)
2. impact: string summary (e.g., "High environmental benefit")
3. co2Saved: estimated CO2 in kg that would be produced if thrown away
4. waterSaved: estimated water in liters saved`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          impact: { type: Type.STRING },
          co2Saved: { type: Type.NUMBER },
          waterSaved: { type: Type.NUMBER }
        },
        required: ["score", "impact", "co2Saved", "waterSaved"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

// 6. Generate Nutritional Summary
export const generateNutritionalSummary = async (
  foodType: string,
  tags: string[]
): Promise<{ calories: number; protein: string; carbs: string; fat: string; nutrients: string[] }> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Generate nutritional summary for a typical serving of:
- Food Type: ${foodType}
- Tags: ${tags.join(", ")}

Return JSON with:
1. calories: approximate calories per serving
2. protein: grams of protein (e.g., "15g")
3. carbs: grams of carbs (e.g., "45g")
4. fat: grams of fat (e.g., "5g")
5. nutrients: array of key nutrients (e.g., ["Iron", "Vitamin B12", "Fiber"])`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.STRING },
          carbs: { type: Type.STRING },
          fat: { type: Type.STRING },
          nutrients: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["calories", "protein", "carbs", "fat", "nutrients"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}
