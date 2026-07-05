// In-memory mock backend, used when VITE_API_URL is not set.
// Enables previewing the UI without any external setup.

import type { Category, Transaction } from '../types'

const CATEGORIES: Category[] = [
  { name: '餐飲', type: 'expense', icon: '🍜' },
  { name: '交通', type: 'expense', icon: '🚌' },
  { name: '日用', type: 'expense', icon: '🛒' },
  { name: '娛樂', type: 'expense', icon: '🎮' },
  { name: '薪資', type: 'income', icon: '💰' },
  { name: '其他收入', type: 'income', icon: '✨' },
]

const today = new Date()
const iso = (d: Date) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return iso(d)
}

const store: Transaction[] = [
  { id: 't1', createdAt: today.toISOString(), date: iso(today),   type: 'expense', category: '餐飲', amount: 180, note: '午餐',   userEmail: 'me@dev.local' },
  { id: 't2', createdAt: today.toISOString(), date: iso(today),   type: 'expense', category: '交通', amount: 60,  note: '捷運',   userEmail: 'me@dev.local' },
  { id: 't3', createdAt: today.toISOString(), date: daysAgo(1),   type: 'expense', category: '日用', amount: 1250, note: '生活用品', userEmail: 'family@dev.local' },
  { id: 't4', createdAt: today.toISOString(), date: daysAgo(2),   type: 'income',  category: '薪資', amount: 52000, note: '',      userEmail: 'me@dev.local' },
  { id: 't5', createdAt: today.toISOString(), date: daysAgo(3),   type: 'expense', category: '娛樂', amount: 450, note: '電影',   userEmail: 'family@dev.local' },
]

let seq = 100
const uuid = () => 'm' + (++seq)

const delay = <T>(v: T, ms = 200) => new Promise<T>((r) => setTimeout(() => r(v), ms))

export async function mockCall<T>(action: string, payload: any): Promise<T> {
  switch (action) {
    case 'listCategories':
      return delay(CATEGORIES as unknown as T)
    case 'listTransactions': {
      const { from, to } = payload ?? {}
      const rows = store
        .filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
        .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : (a.date < b.date ? 1 : -1)))
      return delay(rows as unknown as T)
    }
    case 'createTransaction': {
      const row: Transaction = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        date: payload.date,
        type: payload.type,
        category: payload.category,
        amount: Number(payload.amount),
        note: payload.note ?? '',
        userEmail: 'me@dev.local',
      }
      store.push(row)
      return delay(row as unknown as T)
    }
    case 'updateTransaction': {
      const i = store.findIndex((r) => r.id === payload.id)
      if (i < 0) throw new Error('not found')
      store[i] = { ...store[i], ...payload }
      return delay(store[i] as unknown as T)
    }
    case 'deleteTransaction': {
      const i = store.findIndex((r) => r.id === payload.id)
      if (i >= 0) store.splice(i, 1)
      return delay({ id: payload.id } as unknown as T)
    }
    default:
      throw new Error('mock: unknown action ' + action)
  }
}
