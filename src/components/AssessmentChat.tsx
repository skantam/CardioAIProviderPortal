import React, { useState, useEffect } from 'react'
import { Heart, ArrowLeft, ArrowRight, User, Calendar, Activity, Stethoscope } from 'lucide-react'

interface AssessmentChatProps {
  onComplete: (assessmentId: string) => void
  onBack: () => void
}

interface Question {
  id: string
  text: string
  type: 'select' | 'number' | 'boolean' | 'text'
  options?: string[]
  unit?: string
  required: boolean
}

const questions: Question[] = [
  {
    id: 'age',
    text: 'What is your age?',
    type: 'number',
    unit: 'years',
    required: true
  },
  {
    id: 'gender',
    text: 'What is your biological sex?',
    type: 'select',
    options: ['Male', 'Female'],
    required: true
  },
  {
    id: 'systolic_bp',
    text: 'What is your systolic blood pressure? (The top number)',
    type: 'number',
    unit: 'mmHg',
    required: true
  },
  {
    id: 'total_cholesterol',
    text: 'What is your total cholesterol level?',
    type: 'number',
    unit: 'mg/dL',
    required: true
  },
  {
    id: 'hdl_cholesterol',
    text: 'What is your HDL (good) cholesterol level?',
    type: 'number',
    unit: 'mg/dL',
    required: true
  },
  {
    id: 'smoking_status',
    text: 'Do you currently smoke?',
    type: 'boolean',
    required: true
  },
  {
    id: 'diabetes',
    text: 'Do you have diabetes?',
    type: 'boolean',
    required: true
  },
  {
    id: 'hypertension_treatment',
    text: 'Are you currently taking medication for high blood pressure?',
    type: 'boolean',
    required: true
  },
  {
    id: 'family_history',
    text: 'Do you have a family history of heart disease?',
    type: 'boolean',
    required: true
  },
  {
    id: 'physical_activity',
    text: 'How many days per week do you exercise for at least 30 minutes?',
    type: 'select',
    options: ['0 days', '1-2 days', '3-4 days', '5-6 days', '7 days'],
    required: true
  },
  {
    id: 'chest_pain',
    text: 'Have you experienced chest pain or discomfort recently?',
    type: 'boolean',
    required: true
  },
  {
    id: 'shortness_of_breath',
    text: 'Do you experience shortness of breath during normal activities?',
    type: 'boolean',
    required: true
  }
]

export default function AssessmentChat({ onComplete, onBack }: AssessmentChatProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  useEffect(() => {
    // Reset current answer when question changes
    setCurrentAnswer('')
  }, [currentQuestionIndex])

  const handleAnswer = () => {
    if (!currentAnswer && currentQuestion.required) return

    const processedAnswer = currentQuestion.type === 'boolean' 
      ? currentAnswer === 'Yes' 
      : currentAnswer

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: processedAnswer
    }))

    if (isLastQuestion) {
      submitAssessment({
        ...answers,
        [currentQuestion.id]: processedAnswer
      })
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      // Restore previous answer
      const prevQuestion = questions[currentQuestionIndex - 1]
      const prevAnswer = answers[prevQuestion.id]
      if (prevQuestion.type === 'boolean') {
        setCurrentAnswer(prevAnswer ? 'Yes' : 'No')
      } else {
        setCurrentAnswer(prevAnswer?.toString() || '')
      }
    }
  }

  const submitAssessment = async (finalAnswers: Record<string, any>) => {
    setSubmitting(true)
    try {
      // Calculate risk score using a simplified algorithm
      const riskData = calculateRisk(finalAnswers)
      
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          user_id: null, // Anonymous assessment
          inputs: finalAnswers,
          risk_score: riskData.score,
          risk_category: riskData.category,
          results: riskData,
          status: 'pending_review'
        })
        .select()
        .single()

      if (error) throw error

      onComplete(data.id)
    } catch (error) {
      console.error('Error submitting assessment:', error)
      alert('There was an error submitting your assessment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateRisk = (answers: Record<string, any>) => {
    // Simplified risk calculation based on common factors
    let riskScore = 0
    
    // Age factor
    const age = parseInt(answers.age) || 0
    if (age >= 65) riskScore += 30
    else if (age >= 55) riskScore += 20
    else if (age >= 45) riskScore += 10
    else if (age >= 35) riskScore += 5

    // Gender factor
    if (answers.gender === 'Male') riskScore += 10

    // Blood pressure factor
    const systolic = parseInt(answers.systolic_bp) || 0
    if (systolic >= 160) riskScore += 25
    else if (systolic >= 140) riskScore += 15
    else if (systolic >= 130) riskScore += 10
    else if (systolic >= 120) riskScore += 5

    // Cholesterol factors
    const totalChol = parseInt(answers.total_cholesterol) || 0
    const hdlChol = parseInt(answers.hdl_cholesterol) || 0
    
    if (totalChol >= 240) riskScore += 15
    else if (totalChol >= 200) riskScore += 10
    
    if (hdlChol < 40) riskScore += 15
    else if (hdlChol < 50) riskScore += 5

    // Lifestyle and medical history factors
    if (answers.smoking_status) riskScore += 20
    if (answers.diabetes) riskScore += 25
    if (answers.hypertension_treatment) riskScore += 10
    if (answers.family_history) riskScore += 15
    if (answers.chest_pain) riskScore += 10
    if (answers.shortness_of_breath) riskScore += 10

    // Physical activity (protective factor)
    const activity = answers.physical_activity || '0 days'
    if (activity === '7 days') riskScore -= 10
    else if (activity === '5-6 days') riskScore -= 5
    else if (activity === '3-4 days') riskScore -= 3

    // Ensure score is within reasonable bounds
    riskScore = Math.max(0, Math.min(100, riskScore))

    // Determine category
    let category = 'Low Risk'
    if (riskScore >= 80) category = 'Very High Risk'
    else if (riskScore >= 60) category = 'High Risk'
    else if (riskScore >= 40) category = 'Intermediate Risk'
    else if (riskScore >= 20) category = 'Borderline Risk'

    return {
      score: `${riskScore}%`,
      category,
      factors: {
        age: answers.age,
        gender: answers.gender,
        systolic_bp: answers.systolic_bp,
        smoking: answers.smoking_status,
        diabetes: answers.diabetes,
        family_history: answers.family_history
      }
    }
  }

  const renderQuestionInput = () => {
    switch (currentQuestion.type) {
      case 'select':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <button
                key={option}
                onClick={() => setCurrentAnswer(option)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all font-medium ${
                  currentAnswer === option
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )
      
      case 'boolean':
        return (
          <div className="space-y-3">
            {['Yes', 'No'].map((option) => (
              <button
                key={option}
                onClick={() => setCurrentAnswer(option)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all font-medium ${
                  currentAnswer === option
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )
      
      case 'number':
        return (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="w-full px-6 py-4 text-xl border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 bg-white"
                placeholder="Enter value"
                min="0"
              />
              {currentQuestion.unit && (
                <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  {currentQuestion.unit}
                </span>
              )}
            </div>
          </div>
        )
      
      default:
        return (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            className="w-full px-6 py-4 text-xl border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 bg-white"
            placeholder="Enter your answer"
          />
        )
    }
  }

  const canProceed = currentAnswer || !currentQuestion.required

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 transition-all rounded-xl font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-3 rounded-xl shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">CardioAI Assessment</h1>
                <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-teal-500 h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100">
          {/* Question */}
          <div className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-3 rounded-xl shadow-lg">
                {currentQuestionIndex < 3 ? <User className="w-6 h-6 text-white" /> :
                 currentQuestionIndex < 8 ? <Stethoscope className="w-6 h-6 text-white" /> :
                 <Activity className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{currentQuestion.text}</h2>
                {currentQuestion.unit && (
                  <p className="text-lg text-gray-600 mt-2">Please provide your answer in {currentQuestion.unit}</p>
                )}
              </div>
            </div>
          </div>

          {/* Answer Input */}
          <div className="mb-12">
            {renderQuestionInput()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                {currentQuestionIndex + 1} of {questions.length} questions
              </p>
              <div className="flex space-x-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index <= currentQuestionIndex
                        ? 'bg-gradient-to-r from-blue-500 to-teal-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleAnswer}
              disabled={!canProceed || submitting}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:from-blue-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : isLastQuestion ? (
                <>
                  <span>Complete Assessment</span>
                  <Heart className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Your responses are confidential and will be reviewed by healthcare professionals.
          </p>
        </div>
      </main>
    </div>
  )
}