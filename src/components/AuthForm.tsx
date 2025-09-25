import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Mail, Lock, User, Heart, Shield, ArrowLeft } from 'lucide-react'

interface AuthFormProps {
  mode: 'login' | 'signup' | 'forgot-password' | 'change-password'
  onClose: () => void
  onSuccess: () => void
  onModeChange?: (mode: 'login' | 'signup' | 'forgot-password') => void
}

export default function AuthForm({ mode, onClose, onSuccess, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [country, setCountry] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const validateLicenseNumber = (license: string) => {
    const alphanumericRegex = /^[a-zA-Z0-9]+$/
    return license.length >= 4 && license.length <= 20 && alphanumericRegex.test(license)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) throw error

        setMessage('Password reset email sent! Check your inbox.')
      } else if (mode === 'change-password') {
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match')
        }

        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }

        const { error } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (error) throw error

        setMessage('Password updated successfully!')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else if (mode === 'signup') {
        // Validate license number
        if (!validateLicenseNumber(licenseNumber)) {
          throw new Error('License number must be 4-20 alphanumeric characters')
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) throw authError

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('providers')
            .insert({
              user_id: authData.user.id,
              email: authData.user.email,
              full_name: fullName,
              license_number: licenseNumber,
              country: country,
            })

          if (profileError) throw profileError
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
      }

      if (mode !== 'forgot-password' && mode !== 'change-password') {
        onSuccess()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'forgot-password':
        return 'Reset Password'
      case 'change-password':
        return 'Change Password'
      case 'signup':
        return 'Join CardioAI'
      default:
        return 'Welcome Back'
    }
  }

  const getDescription = () => {
    switch (mode) {
      case 'forgot-password':
        return 'Enter your email to receive a password reset link'
      case 'change-password':
        return 'Enter your new password'
      case 'signup':
        return 'Create your provider account to get started'
      default:
        return 'Sign in to access your provider dashboard'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          {(mode === 'forgot-password' || mode === 'change-password') && onModeChange && (
            <button
              onClick={() => onModeChange('login')}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-3 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">CardioAI</h2>
              <p className="text-sm text-gray-600 font-medium">Provider Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {getTitle()}
          </h3>
          <p className="text-gray-600">
            {getDescription()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'change-password' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900 h-12 bg-white transition-all"
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900 h-12 bg-white transition-all"
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900 h-12 bg-white transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Country
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900 h-12 bg-white transition-all appearance-none"
                    required
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="CH">Switzerland</option>
                    <option value="AT">Austria</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="FI">Finland</option>
                    <option value="IE">Ireland</option>
                    <option value="PT">Portugal</option>
                    <option value="GR">Greece</option>
                    <option value="PL">Poland</option>
                    <option value="CZ">Czech Republic</option>
                    <option value="HU">Hungary</option>
                    <option value="SK">Slovakia</option>
                    <option value="SI">Slovenia</option>
                    <option value="HR">Croatia</option>
                    <option value="BG">Bulgaria</option>
                    <option value="RO">Romania</option>
                    <option value="EE">Estonia</option>
                    <option value="LV">Latvia</option>
                    <option value="LT">Lithuania</option>
                    <option value="LU">Luxembourg</option>
                    <option value="MT">Malta</option>
                    <option value="CY">Cyprus</option>
                    <option value="JP">Japan</option>
                    <option value="KR">South Korea</option>
                    <option value="CN">China</option>
                    <option value="IN">India</option>
                    <option value="SG">Singapore</option>
                    <option value="HK">Hong Kong</option>
                    <option value="TW">Taiwan</option>
                    <option value="MY">Malaysia</option>
                    <option value="TH">Thailand</option>
                    <option value="PH">Philippines</option>
                    <option value="ID">Indonesia</option>
                    <option value="VN">Vietnam</option>
                    <option value="NZ">New Zealand</option>
                    <option value="ZA">South Africa</option>
                    <option value="BR">Brazil</option>
                    <option value="MX">Mexico</option>
                    <option value="AR">Argentina</option>
                    <option value="CL">Chile</option>
                    <option value="CO">Colombia</option>
                    <option value="PE">Peru</option>
                    <option value="UY">Uruguay</option>
                    <option value="EC">Ecuador</option>
                    <option value="BO">Bolivia</option>
                    <option value="PY">Paraguay</option>
                    <option value="VE">Venezuela</option>
                    <option value="GY">Guyana</option>
                    <option value="SR">Suriname</option>
                    <option value="IL">Israel</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="QA">Qatar</option>
                    <option value="KW">Kuwait</option>
                    <option value="BH">Bahrain</option>
                    <option value="OM">Oman</option>
                    <option value="JO">Jordan</option>
                    <option value="LB">Lebanon</option>
                    <option value="EG">Egypt</option>
                    <option value="MA">Morocco</option>
                    <option value="TN">Tunisia</option>
                    <option value="DZ">Algeria</option>
                    <option value="LY">Libya</option>
                    <option value="SD">Sudan</option>
                    <option value="ET">Ethiopia</option>
                    <option value="KE">Kenya</option>
                    <option value="UG">Uganda</option>
                    <option value="TZ">Tanzania</option>
                    <option value="RW">Rwanda</option>
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
                    <option value="CI">Côte d'Ivoire</option>
                    <option value="SN">Senegal</option>
                    <option value="ML">Mali</option>
                    <option value="BF">Burkina Faso</option>
                    <option value="NE">Niger</option>
                    <option value="TD">Chad</option>
                    <option value="CM">Cameroon</option>
                    <option value="CF">Central African Republic</option>
                    <option value="GA">Gabon</option>
                    <option value="CG">Republic of the Congo</option>
                    <option value="CD">Democratic Republic of the Congo</option>
                    <option value="AO">Angola</option>
                    <option value="ZM">Zambia</option>
                    <option value="ZW">Zimbabwe</option>
                    <option value="BW">Botswana</option>
                    <option value="NA">Namibia</option>
                    <option value="SZ">Eswatini</option>
                    <option value="LS">Lesotho</option>
                    <option value="MG">Madagascar</option>
                    <option value="MU">Mauritius</option>
                    <option value="SC">Seychelles</option>
                    <option value="MV">Maldives</option>
                    <option value="LK">Sri Lanka</option>
                    <option value="BD">Bangladesh</option>
                    <option value="PK">Pakistan</option>
                    <option value="AF">Afghanistan</option>
                    <option value="IR">Iran</option>
                    <option value="IQ">Iraq</option>
                    <option value="SY">Syria</option>
                    <option value="TR">Turkey</option>
                    <option value="GE">Georgia</option>
                    <option value="AM">Armenia</option>
                    <option value="AZ">Azerbaijan</option>
                    <option value="KZ">Kazakhstan</option>
                    <option value="UZ">Uzbekistan</option>
                    <option value="TM">Turkmenistan</option>
                    <option value="KG">Kyrgyzstan</option>
                    <option value="TJ">Tajikistan</option>
                    <option value="MN">Mongolia</option>
                    <option value="RU">Russia</option>
                    <option value="BY">Belarus</option>
                    <option value="UA">Ukraine</option>
                    <option value="MD">Moldova</option>
                    <option value="RS">Serbia</option>
                    <option value="ME">Montenegro</option>
                    <option value="BA">Bosnia and Herzegovina</option>
                    <option value="MK">North Macedonia</option>
                    <option value="AL">Albania</option>
                    <option value="XK">Kosovo</option>
                    <option value="IS">Iceland</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Medical License Number
                </label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900 h-12 bg-white transition-all"
                    placeholder="Enter license number (4-20 characters)"
                    minLength={4}
                    maxLength={20}
                    pattern="[A-Za-z0-9]+"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Alphanumeric characters only, 4-20 characters required
                </p>
              </div>
            </>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgot-password') && (
            <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900 h-12 bg-white transition-all"
                placeholder="Enter your email address"
                required
              />
            </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900 h-12 bg-white transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200 font-medium">
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-600 text-sm bg-green-50 p-4 rounded-xl border border-green-200 font-medium">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-teal-600 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg hover:shadow-xl h-12"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {mode === 'login' ? 'Signing In...' : 
                 mode === 'signup' ? 'Creating Account...' :
                 mode === 'forgot-password' ? 'Sending Reset Email...' :
                 'Updating Password...'}
              </div>
            ) : (
              mode === 'login' ? 'Sign In' : 
              mode === 'signup' ? 'Create Provider Account' :
              mode === 'forgot-password' ? 'Send Reset Email' :
              'Update Password'
            )}
          </button>
        </form>

        {/* Footer */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => onModeChange && onModeChange(mode === 'login' ? 'signup' : 'login')}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              {mode === 'login' ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
          {mode === 'login' && (
            <p className="text-sm text-gray-600">
              <button
                onClick={() => onModeChange && onModeChange('forgot-password')}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Forgot your password?
              </button>
            </p>
          )}
          </div>
        )}
      </div>
    </div>
  )
}