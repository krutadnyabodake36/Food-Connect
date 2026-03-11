// OpenRouter AI API client
// Docs: https://openrouter.ai/docs/api-reference

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

// ── Core chat completion ──

export async function chatCompletion(
  messages: Message[],
  options: ChatOptions = {}
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const body: any = {
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1024,
  };

  if (options.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(OPENROUTER_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'FoodConnect',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Vision completion (send image + text) ──

export async function visionCompletion(
  prompt: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  options: ChatOptions = {}
): Promise<string> {
  const messages: Message[] = [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        { type: 'text', text: prompt },
      ],
    },
  ];

  return chatCompletion(messages, options);
}

// ── Helper: convert File to base64 ──

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Helper: extract JSON from AI response ──

export function extractJSON<T>(text: string): T {
  // Try direct parse
  try { return JSON.parse(text); } catch {}

  // Try extracting from markdown code block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try { return JSON.parse(match[1].trim()); } catch {}
  }

  // Try finding first { ... } or [ ... ]
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }

  throw new Error('Could not extract JSON from response');
}

// ══════════════════════════════════════
//  FEATURE-SPECIFIC AI FUNCTIONS
// ══════════════════════════════════════

// ── Feature 2: Food Photo Analyzer ──

export interface FoodAnalysis {
  title: string;
  tags: string[];
  weightEstimate: number;
  servings: number;
  description: string;
}

export async function analyzeFoodPhoto(file: File): Promise<FoodAnalysis> {
  const base64 = await fileToBase64(file);
  const response = await visionCompletion(
    `You are a food donation platform assistant. Analyze this food image and return JSON with:
- "title": a short descriptive title (max 5 words)
- "tags": array of relevant tags like ["Veg", "Rice", "Curry", "Indian", "Bread", "Non-Veg", "Dessert", "Snacks"]
- "weightEstimate": estimated weight in kg (number)
- "servings": estimated number of people this can serve (number)
- "description": a 1-line description for the donation listing

Return ONLY valid JSON, no other text.`,
    base64,
    file.type,
    { temperature: 0.3, jsonMode: true }
  );

  return extractJSON<FoodAnalysis>(response);
}

// ── Feature 3: Waste Pattern Insights ──

export interface WasteInsight {
  insights: { title: string; description: string; icon: string }[];
  summary: string;
}

export async function getWasteInsights(donationHistory: {
  title: string; weight: number; status: string; timestamp: string; tags: string[];
}[]): Promise<WasteInsight> {
  const historyText = donationHistory.map(d =>
    `${d.title} | ${d.weight}kg | ${d.status} | ${d.tags.join(',')} | ${d.timestamp}`
  ).join('\n');

  const response = await chatCompletion([
    {
      role: 'system',
      content: 'You are a food waste reduction analyst for hotels. Analyze donation patterns and give actionable insights.'
    },
    {
      role: 'user',
      content: `Here is a hotel's donation history:\n${historyText}\n\nAnalyze this data and return JSON with:
- "insights": array of 3-4 objects, each with "title" (short), "description" (1-2 sentences actionable tip), "icon" (one emoji)
- "summary": a 1-sentence overall assessment

Return ONLY valid JSON.`
    }
  ], { temperature: 0.6, jsonMode: true });

  return extractJSON<WasteInsight>(response);
}

// ── Feature 4: Smart Pickup Planner ──

export interface PickupPlan {
  route: { donationId: string; title: string; reason: string; order: number }[];
  totalEstimatedMinutes: number;
  tip: string;
}

export async function planPickupRoute(donations: {
  id: string; title: string; weight: number; tags: string[];
  lat: number; lng: number; isUrgent?: boolean; pickupWindow?: string;
}[], userLat: number, userLng: number): Promise<PickupPlan> {
  const donationList = donations.map(d =>
    `ID:${d.id} | "${d.title}" | ${d.weight}kg | ${d.tags.join(',')} | lat:${d.lat.toFixed(4)} lng:${d.lng.toFixed(4)} | urgent:${d.isUrgent ? 'YES' : 'no'} | window:${d.pickupWindow || 'anytime'}`
  ).join('\n');

  const response = await chatCompletion([
    {
      role: 'system',
      content: 'You are a logistics optimizer for a food rescue platform. Plan the most efficient pickup route considering distance, urgency, and food perishability.'
    },
    {
      role: 'user',
      content: `Volunteer is at lat:${userLat.toFixed(4)} lng:${userLng.toFixed(4)}.

Available donations:
${donationList}

Plan the optimal pickup order. Return JSON:
- "route": array of objects with "donationId", "title", "reason" (why this order), "order" (1-based number)
- "totalEstimatedMinutes": estimated total time in minutes
- "tip": a helpful tip for the volunteer

Return ONLY valid JSON.`
    }
  ], { temperature: 0.4, jsonMode: true });

  return extractJSON<PickupPlan>(response);
}

// ── Feature 6: Food Safety Tips ──

export async function getFoodSafetyTips(
  foodTitle: string,
  foodTags: string[],
  distanceKm?: number
): Promise<string[]> {
  const response = await chatCompletion([
    {
      role: 'system',
      content: 'You are a food safety expert. Give brief, practical tips for volunteers transporting donated food.'
    },
    {
      role: 'user',
      content: `A volunteer is picking up: "${foodTitle}" (tags: ${foodTags.join(', ')}).
Transport distance: ${distanceKm ? distanceKm + 'km' : 'unknown'}.

Give exactly 3 short food safety tips specific to this type of food. Each tip should be 1 sentence max.
Return a JSON array of 3 strings like: ["tip1", "tip2", "tip3"]`
    }
  ], { temperature: 0.5, jsonMode: true });

  return extractJSON<string[]>(response);
}

// ── Feature 7: AI Chat Assistant ──

const CHAT_SYSTEM_PROMPT = `You are FoodConnect AI Assistant — a helpful, friendly chatbot for the FoodConnect platform.

FoodConnect is a food donation platform that connects hotels/restaurants with volunteers to reduce food waste.

Key features you can help with:
- Hotels: posting donations, managing requests, OTP verification, export reports
- Volunteers: finding nearby donations on the map, requesting pickups, navigation, impact tracking
- Both: notifications, settings, dark mode

Keep responses concise (2-3 sentences max). Be warm and helpful. Use emojis sparingly.
If asked about something unrelated to food donation, politely redirect.`;

export async function chatWithAssistant(
  messages: { role: 'user' | 'assistant'; content: string }[],
  userRole: 'hotel' | 'volunteer'
): Promise<string> {
  const systemMsg = CHAT_SYSTEM_PROMPT + `\n\nThe user is a ${userRole === 'hotel' ? 'hotel/restaurant partner' : 'volunteer'}.`;

  const allMessages: Message[] = [
    { role: 'system', content: systemMsg },
    ...messages,
  ];

  return chatCompletion(allMessages, { temperature: 0.7, maxTokens: 256 });
}
