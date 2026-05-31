export const STAGES = [
  'Concept',
  'Resource Consent',
  'Developed Design',
  'Costing',
  'Building Consent',
  'Construction'
]

export const PROJECT_STATUSES = ['Feasibility', 'Active', 'Archived']

export const TASK_STATUSES = ['Open', 'In Progress', 'For Review', 'Completed']

export const WIND_ZONES = ['Low', 'Medium', 'High', 'Very High', 'Extra High']

export const EARTHQUAKE_ZONES = ['Zone 1', 'Zone 2', 'Zone 3']

export const EXPOSURE_ZONES = ['A', 'B', 'C', 'D']

// Document management
export const DISCIPLINE_CODES = [
  { code: 'ARCH', label: 'Architecture' },
  { code: 'STR',  label: 'Structural' },
  { code: 'FIRE', label: 'Fire Design' },
  { code: 'INT',  label: 'Interior Design' },
  { code: 'CIVIL',label: 'Civil' },
  { code: 'QS',   label: 'Quantity Surveying' },
  { code: 'GEO',  label: 'Geotechnical' },
  { code: 'PLAN', label: 'Planning' },
  { code: 'MGT',  label: 'Management' },
  { code: 'GEN',  label: 'General' },
]

export const DOC_TYPES = [
  { code: 'DWG',   label: 'Drawing' },
  { code: 'CAL',   label: 'Calculation' },
  { code: 'RPT',   label: 'Report' },
  { code: 'SPEC',  label: 'Specification' },
  { code: 'SCHED', label: 'Schedule' },
  { code: 'CERT',  label: 'Certificate' },
  { code: 'IFC',   label: 'IFC Model' },
  { code: 'PDF',   label: 'PDF' },
  { code: 'BRIEF', label: 'Brief' },
  { code: 'OTHER', label: 'Other' },
]

export const DOC_STATUSES = [
  'For Information',
  'For Approval',
  'For Application',
  'For Construction',
  'Superseded',
]

export const DOC_STATUS_COLORS = {
  'For Information':  { bg: '#E6F1FB', color: '#185FA5' },
  'For Approval':     { bg: '#FAEEDA', color: '#854F0B' },
  'For Application':  { bg: '#EEEDFE', color: '#534AB7' },
  'For Construction': { bg: '#E1F5EE', color: '#0F6E56' },
  'Superseded':       { bg: '#F0EFEF', color: '#999' },
}

export const REVISION_OPTIONS = [
  'R00','R01','R02','R03','R04','R05',
  'R06','R07','R08','R09','R10'
]

export const NZ_TERRITORIAL_AUTHORITIES = [
  'Auckland Council', 'Hamilton City Council', 'Tauranga City Council',
  'Wellington City Council', 'Christchurch City Council', 'Dunedin City Council',
  'Queenstown-Lakes District Council', 'Waikato District Council',
  'Bay of Plenty Regional Council', 'Hawke\'s Bay Regional Council',
  'Manawatū-Whanganui Regional Council', 'Nelson City Council',
  'Marlborough District Council', 'West Coast Regional Council',
  'Otago Regional Council', 'Southland District Council',
  'Invercargill City Council', 'Gore District Council',
  'Central Otago District Council', 'Clutha District Council',
  'Waitaki District Council', 'MacKenzie District Council',
  'Timaru District Council', 'Selwyn District Council',
  'Kaikōura District Council', 'Hurunui District Council',
  'Waimakariri District Council', 'Tasman District Council',
  'Buller District Council', 'Grey District Council',
  'Westland District Council', 'Kāpiti Coast District Council',
  'Porirua City Council', 'Hutt City Council', 'Upper Hutt City Council',
  'South Wairarapa District Council', 'Carterton District Council',
  'Masterton District Council', 'Palmerston North City Council',
  'Rangitīkei District Council', 'Whanganui District Council',
  'Ruapehu District Council', 'Horowhenua District Council',
  'Tararua District Council', 'New Plymouth District Council',
  'Stratford District Council', 'South Taranaki District Council',
  'Rotorua Lakes Council', 'Taupō District Council',
  'Whakatāne District Council', 'Kawerau District Council',
  'Ōpōtiki District Council', 'Gisborne District Council',
  'Wairoa District Council', 'Hastings District Council',
  'Central Hawke\'s Bay District Council', 'Napier City Council',
  'Thames-Coromandel District Council', 'Hauraki District Council',
  'Matamata-Piako District Council', 'Waipā District Council',
  'Waitomo District Council', 'Ōtorohanga District Council',
  'South Waikato District Council', 'Taupō District Council',
  'Far North District Council', 'Whangārei District Council',
  'Kaipara District Council', 'Rodney District', 'Other'
]

export const STAGE_COLORS = {
  'Concept':           { bg: '#EAF3DE', color: '#3B6D11' },
  'Resource Consent':  { bg: '#E6F1FB', color: '#185FA5' },
  'Developed Design':  { bg: '#EEEDFE', color: '#534AB7' },
  'Costing':           { bg: '#FAEEDA', color: '#854F0B' },
  'Building Consent':  { bg: '#FAECE7', color: '#993C1D' },
  'Construction':      { bg: '#E1F5EE', color: '#0F6E56' }
}

export const STATUS_COLORS = {
  'Feasibility': { bg: '#F1EFE8', color: '#5F5E5A' },
  'Active':      { bg: '#E1F5EE', color: '#0F6E56' },
  'Archived':    { bg: '#F0EFEF', color: '#999' }
}

export const TASK_STATUS_COLORS = {
  'Open':        { bg: '#F1EFE8', color: '#5F5E5A' },
  'In Progress': { bg: '#E6F1FB', color: '#185FA5' },
  'For Review':  { bg: '#FAEEDA', color: '#854F0B' },
  'Completed':   { bg: '#E1F5EE', color: '#0F6E56' }
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
