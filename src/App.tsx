import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from './lib/supabase'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import ReviewAssessment from './components/ReviewAssessment'
import AuthForm from './components/AuthForm'
import EnvCheck from './components/EnvCheck'

type AppState = 'landing' | 'dashboard' | 'review' | 'reset-password'

function App() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check environment configuration first
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return <EnvCheck />
  }

  useEffect(() => {
    const initializeApp = async () => {
      try {
        checkForPasswordReset()
        await checkAuthState()
      } catch (error) {
        console.error('App initialization error:', error)
        setAppState('landing')
        setLoading(false)
      }
    }
    
    initializeApp()
  }, [])

  const checkForPasswordReset = () => {
    // Check if this is a password reset redirect
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')
    
    if (type === 'recovery') {
      setAppState('reset-password')
      setLoading(false)
      return
    }
  }
  const checkAuthState = async () => {
    // Skip auth check if we're handling password reset
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('type') === 'recovery') {
      setLoading(false)
      return
    }

    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error('Supabase environment variables not configured')
        setAppState('landing')
        setLoading(false)
        return
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setAppState('landing')
        setLoading(false)
        return
      }
      
      if (session) {
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle()
        
        if (providerError) {
          console.error('Provider query error:', providerError)
          await supabase.auth.signOut()
          setAppState('landing')
        } else if (provider) {
          setAppState('dashboard')
        } else {
          // No provider record, sign out
          await supabase.auth.signOut()
          setAppState('landing')
        }
      } else {
        setAppState('landing')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setAppState('landing')
    } finally {
      setLoading(false)
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session) {
          // Check if user has a provider record
          const { data: provider, error: providerError } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle()
          
          if (providerError) {
            console.error('Provider query error:', providerError)
            await supabase.auth.signOut()
            setAppState('landing')
            return
          }
          
          if (provider) {
            setAppState('dashboard')
          } else {
            // No provider record, sign out
            await supabase.auth.signOut()
            setAppState('landing')
          }
        } else {
          setAppState('landing')
          setSelectedAssessmentId(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setAppState('landing')
      }
    })
  }

  const handlePasswordResetSuccess = () => {
    // Clear URL parameters and redirect to dashboard
    window.history.replaceState({}, document.title, window.location.pathname)
    setAppState('dashboard')
  }
  const handleAuthSuccess = () => {
    setAppState('dashboard')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAppState('landing')
    setSelectedAssessmentId(null)
  }

  const handleSelectAssessment = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId)
    setAppState('review')
  }

  const handleBackToDashboard = () => {
    setSelectedAssessmentId(null)
    setAppState('dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-4 rounded-2xl shadow-lg mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <Heart className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {appState === 'landing' && (
        <LandingPage onAuthSuccess={handleAuthSuccess} />
      )}
      {appState === 'dashboard' && (
        <Dashboard 
          onLogout={handleLogout}
          onSelectAssessment={handleSelectAssessment}
        />
      )}
      {appState === 'review' && selectedAssessmentId && (
        <ReviewAssessment
          assessmentId={selectedAssessmentId}
          onBack={handleBackToDashboard}
        />
      )}
      {appState === 'reset-password' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center font-sans">
          <AuthForm
            mode="change-password"
            onClose={() => setAppState('landing')}
            onSuccess={handlePasswordResetSuccess}
          />
        </div>
      )}
    </>
  )
}

export default App