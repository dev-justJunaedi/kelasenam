
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    console.log('Testing Supabase connection...')

    // Check students table columns by inserting a dummy record that we delete immediately
    // or better, just select * limit 1
    const { data, error } = await supabase.from('students').select('*').limit(1)

    if (error) {
        console.error('Error fetching students:', error)
        return
    }

    console.log('Successfully connected!')
    if (data && data.length > 0) {
        console.log('Found students. Sample keys:', Object.keys(data[0]))
    } else {
        console.log('Students table is empty, but connection works.')
    }
}

testConnection()
