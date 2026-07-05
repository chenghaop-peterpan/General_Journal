import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Profile = { email: string; name?: string; picture?: string }

type AuthState = {
  idToken: string | null
  profile: Profile | null
  setSession: (idToken: string, profile: Profile) => void
  signOut: () => void
}

const KEY = 'fundapp.session.v1'

// Cache expiry ~50min to stay under Google's 1h ID token TTL.
const MAX_AGE_MS = 50 * 60 * 1000

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [idToken, setIdToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { idToken: string; profile: Profile; at: number }
      if (Date.now() - parsed.at < MAX_AGE_MS) {
        setIdToken(parsed.idToken)
        setProfile(parsed.profile)
      } else {
        sessionStorage.removeItem(KEY)
      }
    } catch {
      sessionStorage.removeItem(KEY)
    }
  }, [])

  const setSession = useCallback((token: string, p: Profile) => {
    setIdToken(token)
    setProfile(p)
    sessionStorage.setItem(KEY, JSON.stringify({ idToken: token, profile: p, at: Date.now() }))
  }, [])

  const signOut = useCallback(() => {
    setIdToken(null)
    setProfile(null)
    sessionStorage.removeItem(KEY)
  }, [])

  const value = useMemo(() => ({ idToken, profile, setSession, signOut }), [idToken, profile, setSession, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
