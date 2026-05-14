import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://voqqmeipwsprmducxbux.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvcXFtZWlwd3Nwcm1kdWN4YnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODQxMjAsImV4cCI6MjA5NDI2MDEyMH0.lVP0PfF33u3MdEs1lyv0g5kx2cko4UZq4bxTG2ClaF0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
