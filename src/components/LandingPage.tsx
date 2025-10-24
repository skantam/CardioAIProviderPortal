import React, { useState } from 'react'
import { Heart, Shield, Users } from 'lucide-react'
import AuthForm from './AuthForm'

interface LandingPageProps {
  onAuthSuccess: () => void
}

export default function LandingPage({ onAuthSuccess }: LandingPageProps) {
  const [showAuthForm, setShowAuthForm] = useState<'login' | 'signup' | 'forgot-password' | null>(null)

  const handleModeChange = (mode: 'login' | 'signup' | 'forgot-password') => {
    setShowAuthForm(mode)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 font-sans overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 will-change-transform">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-3 rounded-xl shadow-lg will-change-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">CardioAI</h1>
                <p className="text-sm text-gray-600 font-medium">Provider Portal</p>
              </div>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => setShowAuthForm('login')}
                className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-teal-600 transition-colors duration-200 font-semibold shadow-lg hover:shadow-xl h-12"
              >
                Login
              </button>
              <button
                onClick={() => setShowAuthForm('signup')}
                className="border-2 border-blue-500 text-blue-600 px-6 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 transition-colors duration-200 font-semibold h-12"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 will-change-transform">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold text-gray-900 mb-8 leading-tight">
            AI-Powered Cardiovascular Risk Assessment
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Review and manage patient cardiovascular risk assessments with advanced AI insights. 
            Streamline your workflow and provide better patient care.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowAuthForm('signup')}
              className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-teal-600 transition-colors duration-200 font-semibold text-lg shadow-lg hover:shadow-xl h-14"
            >
              Get Started
            </button>
            <button
              onClick={() => setShowAuthForm('login')}
              className="border-2 border-blue-500 text-blue-600 px-8 py-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 transition-colors duration-200 font-semibold text-lg h-14"
            >
              Login
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg will-change-transform">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Risk Assessment Review
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Review AI-generated cardiovascular risk assessments with detailed recommendations and patient data.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg will-change-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Patient Management
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Efficiently manage patient assessments with organized dashboards and status tracking.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg will-change-transform">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Clinical Decision Support
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Make informed decisions with AI-powered insights and customizable recommendation workflows.
            </p>
          </div>
        </div>
      </main>

      {/* Auth Form Modal */}
      {showAuthForm && (
        <AuthForm
          mode={showAuthForm}
          onClose={() => setShowAuthForm(null)}
          onSuccess={() => {
            setShowAuthForm(null)
            onAuthSuccess()
          }}
          onModeChange={handleModeChange}
        />
      )}
    </div>
  )
}