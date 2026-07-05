import { useState } from 'react'
import { format } from 'date-fns'
import { useCategories, useCreateTransaction } from './useTransactions'
import type { TxType } from '../../types'

const today = () => format(new Date(), 'yyyy-MM-dd')

export function TransactionForm({ onDone }: { onDone?: () => void }) {
  const [date, setDate] = useState(today())
  const [type, setType] = useState<TxType>('expense')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const cats = useCategories()
  const create = useCreateTransaction()

  const options = (cats.data ?? []).filter((c) => c.type === type)

  const canSubmit = date && category && amount && Number(amount) > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    await create.mutateAsync({
      date,
      type,
      category,
      amount: Number(amount),
      note,
    })
    setAmount('')
    setNote('')
    onDone?.()
  }

  return (
    <form onSubmit={submit} className="space-y-4 bg-white p-4 rounded-2xl shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setType('expense'); setCategory('') }}
          className={`h-11 rounded-xl font-medium ${type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategory('') }}
          className={`h-11 rounded-xl font-medium ${type === 'income' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          收入
        </button>
      </div>

      <label className="block">
        <span className="text-xs text-gray-500">日期</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full h-11 rounded-xl border border-gray-200 px-3"
        />
      </label>

      <label className="block">
        <span className="text-xs text-gray-500">分類</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full h-11 rounded-xl border border-gray-200 px-3 bg-white"
        >
          <option value="">選擇分類...</option>
          {options.map((c) => (
            <option key={c.name} value={c.name}>{c.icon ? c.icon + ' ' : ''}{c.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs text-gray-500">金額</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="mt-1 w-full h-12 rounded-xl border border-gray-200 px-3 text-lg"
        />
      </label>

      <label className="block">
        <span className="text-xs text-gray-500">備註 (選填)</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full h-11 rounded-xl border border-gray-200 px-3"
        />
      </label>

      {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}

      <button
        type="submit"
        disabled={!canSubmit || create.isPending}
        className="w-full h-12 rounded-xl bg-indigo-600 text-white font-medium disabled:bg-gray-300"
      >
        {create.isPending ? '儲存中...' : '儲存'}
      </button>
    </form>
  )
}
