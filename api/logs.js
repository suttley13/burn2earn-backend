import { supabase } from '../lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, date } = req.query

  if (!userId) return res.status(400).json({ error: 'userId is required' })
  if (!date) return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' })

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' })
  }

  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: true })

  if (error) {
    console.error('Supabase select error:', error)
    return res.status(500).json({ error: `Database error: ${error.message}` })
  }

  return res.status(200).json(data)
}
