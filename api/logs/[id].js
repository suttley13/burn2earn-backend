import { supabase } from '../../lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) return res.status(400).json({ error: 'id is required' })

  const { error, count } = await supabase
    .from('food_logs')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    console.error('Supabase delete error:', error)
    return res.status(500).json({ error: `Database error: ${error.message}` })
  }

  if (count === 0) {
    return res.status(404).json({ error: 'Log entry not found' })
  }

  return res.status(204).end()
}
