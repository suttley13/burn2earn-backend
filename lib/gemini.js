import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const PROMPT = `Analyze this food image and estimate its nutritional content.
Return ONLY a valid JSON object with no markdown, no code fences, and no extra text.
Schema: { "name": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": "high" | "medium" | "low", "notes": string }
- calories must be a whole number
- protein_g, carbs_g, fat_g are numbers rounded to one decimal place
- confidence reflects how certain you are given image clarity and portion visibility
- notes should mention any assumptions made about portion size or ingredients`

/**
 * @param {string} base64Image  Raw base64-encoded image data (no data URI prefix)
 * @param {string} mimeType     e.g. "image/jpeg"
 * @param {string} [userText]   Optional user-provided context
 * @returns {Promise<{ name: string, calories: number, protein_g: number, carbs_g: number, fat_g: number, confidence: string, notes: string }>}
 */
export async function analyzeFood(base64Image, mimeType, userText) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const promptParts = [
    { text: userText ? `${PROMPT}\n\nUser note: ${userText}` : PROMPT },
    { inlineData: { mimeType, data: base64Image } },
  ]

  const result = await model.generateContent(promptParts)
  const text = result.response.text().trim()

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    // Gemini occasionally wraps output in backticks — strip and retry
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(cleaned)
  }

  return {
    name: String(parsed.name),
    calories: Math.round(Number(parsed.calories)),
    protein_g: Number(parsed.protein_g),
    carbs_g: Number(parsed.carbs_g),
    fat_g: Number(parsed.fat_g),
    confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
    notes: String(parsed.notes ?? ''),
  }
}
