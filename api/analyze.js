import formidable from 'formidable'
import { analyzeFood } from '../lib/gemini.js'
import { supabase } from '../lib/supabase.js'

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let fields
  try {
    fields = await parseForm(req)
  } catch (err) {
    return res.status(400).json({ error: `Failed to parse request: ${err.message}` })
  }

  const { image, text, userId } = fields

  if (!image) return res.status(400).json({ error: 'image is required' })
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  // Detect MIME type from base64 prefix or default to jpeg
  let base64Data = image
  let mimeType = 'image/jpeg'
  const dataUriMatch = image.match(/^data:(image\/\w+);base64,(.+)$/)
  if (dataUriMatch) {
    mimeType = dataUriMatch[1]
    base64Data = dataUriMatch[2]
  }

  let analysis
  try {
    analysis = await analyzeFood(base64Data, mimeType, text || undefined)
  } catch (err) {
    console.error('Gemini error:', err)
    return res.status(502).json({ error: `AI analysis failed: ${err.message}` })
  }

  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      food_name: analysis.name,
      calories: analysis.calories,
      protein_g: analysis.protein_g,
      carbs_g: analysis.carbs_g,
      fat_g: analysis.fat_g,
      confidence: analysis.confidence,
      notes: analysis.notes,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    return res.status(500).json({ error: `Database error: ${error.message}` })
  }

  return res.status(200).json({
    id: data.id,
    food_name: data.food_name,
    calories: data.calories,
    protein_g: data.protein_g,
    carbs_g: data.carbs_g,
    fat_g: data.fat_g,
    confidence: data.confidence,
    notes: data.notes,
    logged_at: data.logged_at,
  })
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 })
    form.parse(req, (err, fields) => {
      if (err) return reject(err)
      // formidable v3 returns arrays; unwrap single values
      const flat = {}
      for (const [key, val] of Object.entries(fields)) {
        flat[key] = Array.isArray(val) ? val[0] : val
      }
      resolve(flat)
    })
  })
}
