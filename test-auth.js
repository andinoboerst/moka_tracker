// Simple test to verify authentication
import { supabase } from './lib/supabase.ts'

async function testAuth() {
  console.log('Testing Supabase connection...')
  
  // Test 1: Check if environment variables are loaded
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  
  // Test 2: Try to get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  console.log('Session:', session)
  console.log('Session error:', sessionError)
  
  // Test 3: Try to sign up a test user
  if (!session) {
    console.log('No session found, trying to sign up test user...')
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    console.log('Sign up result:', { data, error: signUpError })
    
    if (data?.user) {
      console.log('Test user created, trying to sign in...')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      })
      console.log('Sign in result:', { error: signInError })
    }
  }
}

testAuth().catch(console.error)
