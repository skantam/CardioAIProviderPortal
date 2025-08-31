import React from 'react'
import { Heart, Shield, Brain, Activity, ArrowRight } from 'lucide-react'

interface LandingPageProps {
  onStartAssessment: () => void
}

export default function LandingPage({ onStartAssessment }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-4 rounded-2xl shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900">CardioAI</h1>
                <p className="text-lg text-gray-600 font-medium">Cardiovascular Risk Assessment</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Know Your Heart Health Risk
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            Take our AI-powered cardiovascular risk assessment to understand your 10-year heart disease risk. 
            Get personalized recommendations from healthcare professionals.
          </p>
          <button
            onClick={onStartAssessment}
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-12 py-6 rounded-2xl hover:from-blue-600 hover:to-teal-600 transition-all font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center space-x-3 mx-auto"
          >
            <span>Start Assessment</span>
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="text-sm text-gray-500 mt-4">Takes 3-5 minutes • Free • Confidential</p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-100 hover:shadow-xl transition-all">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              AI-Powered Analysis
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Advanced algorithms analyze your health data to provide accurate cardiovascular risk predictions.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-100 hover:shadow-xl transition-all">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Professional Review
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Your assessment is reviewed by qualified healthcare professionals for personalized recommendations.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-100 hover:shadow-xl transition-all">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Actionable Insights
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Receive clear, actionable recommendations to improve your cardiovascular health.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Answer Questions</h4>
              <p className="text-gray-600">Complete our comprehensive health questionnaire about your medical history and lifestyle.</p>
            </div>
            <div className="text-center">
              <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-teal-600">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">AI Analysis</h4>
              <p className="text-gray-600">Our AI analyzes your data using validated cardiovascular risk prediction models.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Get Results</h4>
              <p className="text-gray-600">Receive your risk assessment and personalized recommendations from healthcare professionals.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl p-12 text-white shadow-xl">
            <h3 className="text-3xl font-bold mb-4">Ready to Learn About Your Heart Health?</h3>
            <p className="text-xl mb-8 opacity-90">Take the first step towards better cardiovascular health today.</p>
            <button
              onClick={onStartAssessment}
              className="bg-white text-blue-600 px-10 py-4 rounded-xl hover:bg-gray-50 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-3 mx-auto"
            >
              <span>Begin Assessment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}