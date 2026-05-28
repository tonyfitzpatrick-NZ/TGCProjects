import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nlqgqmsbyuxgvldlvstx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scWdxbXNieXV4Z3ZsZGx2c3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDc3MzksImV4cCI6MjA5NTUyMzczOX0.sKpo5fky3n9NXlNflPEUj8laueShMNial7DrGRiwQFM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const STAGES = [
  'Concept',
  'Resource Consent',
  'Developed Design',
  'Costing',
  'Building Consent',
  'Construction'
]

export const STAGE_COLORS = {
  'Concept':           { bg: '#EAF3DE', color: '#3B6D11' },
  'Resource Consent':  { bg: '#E6F1FB', color: '#185FA5' },
  'Developed Design':  { bg: '#EEEDFE', color: '#534AB7' },
  'Costing':           { bg: '#FAEEDA', color: '#854F0B' },
  'Building Consent':  { bg: '#FAECE7', color: '#993C1D' },
  'Construction':      { bg: '#E1F5EE', color: '#0F6E56' }
}

export const FILE_TYPE_COLORS = {
  pdf:  { bg: '#FAECE7', color: '#993C1D' },
  dwg:  { bg: '#E6F1FB', color: '#185FA5' },
  ifc:  { bg: '#E1F5EE', color: '#0F6E56' },
  xlsx: { bg: '#EAF3DE', color: '#3B6D11' },
  docx: { bg: '#EEEDFE', color: '#534AB7' },
  doc:  { bg: '#EEEDFE', color: '#534AB7' },
  jpg:  { bg: '#FAEEDA', color: '#854F0B' },
  png:  { bg: '#FAEEDA', color: '#854F0B' },
  link: { bg: '#F1EFE8', color: '#5F5E5A' }
}
