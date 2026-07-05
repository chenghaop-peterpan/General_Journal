export type TxType = 'income' | 'expense'

export type Transaction = {
  id: string
  createdAt: string
  date: string // YYYY-MM-DD
  type: TxType
  category: string
  amount: number
  note: string
  userEmail: string
}

export type Category = {
  name: string
  type: TxType
  icon?: string
}
