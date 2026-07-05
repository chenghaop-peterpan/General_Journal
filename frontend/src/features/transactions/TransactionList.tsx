import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useDeleteTransaction, useTransactions } from './useTransactions'
import type { Transaction } from '../../types'

function groupByDate(txs: Transaction[]) {
  const map = new Map<string, Transaction[]>()
  for (const t of txs) {
    const arr = map.get(t.date) ?? []
    arr.push(t)
    map.set(t.date, arr)
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

const fmt = (n: number) => n.toLocaleString('zh-TW')

export function TransactionList({ from, to }: { from?: string; to?: string }) {
  const q = useTransactions({ from, to })
  const del = useDeleteTransaction()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const groups = useMemo(() => groupByDate(q.data ?? []), [q.data])

  if (q.isLoading) return <p className="text-sm text-gray-500 p-4">載入中...</p>
  if (q.isError) return <p className="text-sm text-red-600 p-4">{(q.error as Error).message}</p>
  if (groups.length === 0) return <p className="text-sm text-gray-500 p-4">還沒有紀錄</p>

  return (
    <ul className="space-y-3">
      {groups.map(([date, items]) => {
        const dayIn = items.filter((i) => i.type === 'income').reduce((s, i) => s + i.amount, 0)
        const dayOut = items.filter((i) => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
        return (
          <li key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-baseline justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-sm font-medium">{date}</span>
              <span className="text-xs text-gray-500">
                {dayIn > 0 && <span className="text-emerald-600 mr-2">+{fmt(dayIn)}</span>}
                {dayOut > 0 && <span className="text-red-600">-{fmt(dayOut)}</span>}
              </span>
            </div>
            <ul>
              {items.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50 first:border-t-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{t.category}</span>
                      <span className="text-xs text-gray-400 truncate">{t.note}</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">{t.userEmail}</div>
                  </div>
                  <div className={`text-base font-semibold tabular-nums ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </div>
                  {confirmId === t.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { del.mutate(t.id); setConfirmId(null) }}
                        className="text-xs px-2 py-1 rounded-md bg-red-500 text-white"
                      >
                        刪除
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs px-2 py-1 rounded-md bg-gray-200"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(t.id)}
                      aria-label="delete"
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}
