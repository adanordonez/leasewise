import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface LeaseData {
  id?: string
  created_at?: string
  pdf_url: string
  building_name: string
  property_address: string
  monthly_rent: number
  security_deposit: number
  lease_start_date: string
  lease_end_date: string
  notice_period_days: number
  property_type: string
  square_footage?: number
  bedrooms?: number
  bathrooms?: number
  parking_spaces?: number
  pet_policy: string
  utilities_included: string[]
  amenities: string[]
  landlord_name?: string
  management_company?: string
  contact_email?: string
  contact_phone?: string
  lease_terms: string[]
  special_clauses: string[]
  market_analysis: {
    rent_percentile: number
    deposit_status: string
    rent_analysis: string
  }
  red_flags: Array<{
    issue: string
    severity: string
    explanation: string
  }>
  tenant_rights: Array<{
    right: string
    law: string
  }>
  key_dates: Array<{
    event: string
    date: string
    description: string
  }>
  raw_analysis: any
}

export interface PDFUpload {
  id?: string
  created_at?: string
  filename: string
  file_size: number
  content_type: string
  url: string
  lease_data_id?: string
}
