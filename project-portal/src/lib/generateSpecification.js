import { supabase } from './supabase'

/**
 * Generates specification data (including dynamic TOC) for a project
 * @param {string} projectId - The UUID of the project
 */
export async function generateSpecification(projectId) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-specification', {
      body: { project_id: projectId }
    })

    if (error) {
      console.error('Edge Function error:', error)
      throw new Error(error.message || 'Failed to generate specification')
    }

    return data
  } catch (err) {
    console.error('Failed to call generate-specification:', err)
    throw err
  }
}