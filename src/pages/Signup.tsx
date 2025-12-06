import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const Signup: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    // Create profile row once user exists.
    const userId = data.user?.id
    if (userId) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        display_name: displayName
      })
      if (profileError) console.error('Profile creation failed', profileError)
    }
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="glass w-full max-w-md rounded-2xl p-6">
        <h1 className="mb-4 text-2xl font-bold text-neon">Create account</h1>
        <div className="space-y-3">
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Display name"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-neon"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-neon"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-neon"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={loading}
            onClick={() => void handleSignup()}
            className="w-full rounded-xl bg-gradient-to-r from-neon to-zyn py-3 text-sm font-semibold text-ink shadow-lg disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-neon underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
