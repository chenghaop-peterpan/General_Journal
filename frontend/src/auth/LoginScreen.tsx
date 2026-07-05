import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from './AuthProvider'
import { USE_MOCK } from '../api/client'

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export function LoginScreen() {
  const { setSession } = useAuth()
  const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-2xl font-semibold mb-2">FundApp</h1>
        <p className="text-sm text-gray-500 mb-6">家庭資金管理</p>

        {hasClientId ? (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(cred) => {
                const token = cred.credential
                if (!token) return
                const p = decodeJwt(token) as { email?: string; name?: string; picture?: string } | null
                if (!p?.email) return
                setSession(token, { email: p.email, name: p.name, picture: p.picture })
              }}
              onError={() => console.error('Google login failed')}
              useOneTap
            />
          </div>
        ) : (
          <button
            onClick={() => setSession('dev-token', { email: 'me@dev.local', name: 'Dev User' })}
            className="w-full h-11 rounded-xl bg-indigo-600 text-white font-medium"
          >
            Dev 登入 (預覽 UI)
          </button>
        )}

        {USE_MOCK && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-4">
            Mock 模式:資料只存在瀏覽器記憶體,重整會消失
          </p>
        )}

        <p className="text-xs text-gray-400 mt-6">
          {hasClientId
            ? <>使用您的 Google 帳號登入。<br />僅家庭成員可存取。</>
            : <>設好 <code className="text-[10px]">.env.local</code> 後會切回 Google 登入</>
          }
        </p>
      </div>
    </div>
  )
}
