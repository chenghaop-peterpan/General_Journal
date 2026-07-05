import { useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { Plus, LogOut } from 'lucide-react'
import { useAuth } from './auth/AuthProvider'
import { LoginScreen } from './auth/LoginScreen'
import { TransactionForm } from './features/transactions/TransactionForm'
import { TransactionList } from './features/transactions/TransactionList'
import { useTransactions } from './features/transactions/useTransactions'

function MonthSummary({ from, to }: { from: string; to: string }) {
  const q = useTransactions({ from, to })
  const items = q.data ?? []
  const income = items.filter((i) => i.type === 'income').reduce((s, i) => s + i.amount, 0)
  const expense = items.filter((i) => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
  const balance = income - expense
  const fmt = (n: number) => n.toLocaleString('zh-TW')

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-3 gap-2 text-center">
      <div>
        <div className="text-xs text-gray-500">本月收入</div>
        <div className="text-lg font-semibold text-emerald-600 tabular-nums">{fmt(income)}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">本月支出</div>
        <div className="text-lg font-semibold text-red-600 tabular-nums">{fmt(expense)}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">結餘</div>
        <div className={`text-lg font-semibold tabular-nums ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
          {fmt(balance)}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { idToken, profile, signOut } = useAuth()
  const [showForm, setShowForm] = useState(false)

  if (!idToken) return <LoginScreen />

  const monthFrom = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthTo = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            {profile?.picture && (
              <img src={profile.picture} alt="" className="w-8 h-8 rounded-full" />
            )}
            <div className="leading-tight">
              <div className="text-sm font-semibold">FundApp</div>
              <div className="text-xs text-gray-500">{profile?.name || profile?.email}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-gray-400 hover:text-gray-700"
            aria-label="logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4 pb-24">
        <MonthSummary from={monthFrom} to={monthTo} />

        {showForm && (
          <TransactionForm onDone={() => setShowForm(false)} />
        )}

        <TransactionList from={monthFrom} to={monthTo} />
      </main>

      <button
        onClick={() => setShowForm((v) => !v)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center"
        aria-label={showForm ? 'close form' : 'add transaction'}
      >
        <Plus size={26} className={`transition-transform ${showForm ? 'rotate-45' : ''}`} />
      </button>
    </div>
  )
}
