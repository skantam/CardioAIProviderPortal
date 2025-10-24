import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function EnvCheck() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const isPlaceholder = (value: string | undefined) => {
    return value === 'your_supabase_url_here' || value === 'your_supabase_anon_key_here'
  }

  const hasValidUrl = supabaseUrl && supabaseUrl.startsWith('https://') && !isPlaceholder(supabaseUrl)
  const hasValidKey = supabaseKey && supabaseKey.length > 20 && !isPlaceholder(supabaseKey)

  if (!hasValidUrl || !hasValidKey) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center font-sans">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4 border border-red-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Configuration Error</h2>
          </div>
          <p className="text-gray-700 mb-4">
            The application is not properly configured. Issues found:
          </p>
          <ul className="text-sm text-gray-600 mb-4">
            {!hasValidUrl && <li>• VITE_SUPABASE_URL is missing, invalid, or contains placeholder value</li>}
            {!hasValidKey && <li>• VITE_SUPABASE_ANON_KEY is missing, invalid, or contains placeholder value</li>}
          </ul>
          <p className="text-sm text-gray-500">
            Please contact the administrator to configure the application with valid Supabase credentials.
          </p>
        </div>
      </div>
    )
  }

  return null
}