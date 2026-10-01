import { supabase } from '../../supabase';
import { defaultSystemKnowledge } from './systemKnowledge';

/**
 * KnowledgeService queries scoped knowledge items from Supabase with token-conscious filtering
 */
export async function getRelevantKnowledge({ orgId, category, tags = [] }) {
  try {
    let query = supabase
      .from('knowledge_items')
      .select('*')
      .or(`organization_id.eq.${orgId},organization_id.is.null,is_system.eq.true`)
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Database knowledge retrieval failed, using fallback:', err.message);
  }

  // Fallback to embedded default knowledge
  if (category) {
    return defaultSystemKnowledge.filter(k => k.category === category);
  }
  return defaultSystemKnowledge;
}
