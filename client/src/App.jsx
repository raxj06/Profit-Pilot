import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard.jsx'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import AuthForm from './components/AuthForm.jsx'
import DemoAuthForm from './components/DemoAuthForm.jsx'
import { supabase, getCurrentUser, isSupabaseConfigured } from './lib/supabase.js'
import { Routes, Route, Navigate } from 'react-router-dom'

const App = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, falling back to demo mode')
      setIsDemoMode(true)
      
      // Check localStorage for demo user
      const storedUser = localStorage.getItem('demoUser')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      setLoading(false)
      return
    }

    // Supabase is configured, use real authentication
    const initAuth = async () => {
      try {
        const user = await getCurrentUser()
        setUser(user)
        setLoading(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        setConfigError(true)
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthSuccess = (userData = null) => {
    if (isDemoMode && userData) {
      // Demo mode: store user in localStorage
      localStorage.setItem('demoUser', JSON.stringify(userData))
      setUser(userData)
    }
    // For Supabase mode, auth state change will handle user setting
    console.log('Authentication successful')
  }

  const handleLogout = async () => {
    if (isDemoMode) {
      localStorage.removeItem('demoUser')
      setUser(null)
    } else {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error logging out:', error.message)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
            <p className="text-gray-600 mb-4">
              There was an error connecting to Supabase. Please check your configuration.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show dashboard if user is authenticated, otherwise show auth form
  return user ? (
    <>
      <Routes>
        <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  ) : (
    <>
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm z-50">
          🚀 Demo Mode: Supabase not configured. Using local authentication for demonstration.
        </div>
      )}
      {isDemoMode ? (
        <DemoAuthForm onAuthSuccess={handleAuthSuccess} />
      ) : (
        <Routes>
          <Route path="/login" element={<Login onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<Register onAuthSuccess={handleAuthSuccess} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </>
  )
}

export default App