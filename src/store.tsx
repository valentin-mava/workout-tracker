import { get, set } from 'idb-keyval'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AppData } from './types'

const KEY = 'workout-tracker-data'

export const emptyData = (): AppData => ({ version: 1, workouts: [], sessions: [], draft: null })

interface Store {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const latest = useRef<AppData | null>(null)

  useEffect(() => {
    get<AppData>(KEY).then((d) => {
      latest.current = d ?? emptyData()
      setData(latest.current)
    })
    // Bittet den Browser, die Daten nicht automatisch zu löschen
    navigator.storage?.persist?.()
  }, [])

  const update = useCallback((fn: (d: AppData) => AppData) => {
    if (!latest.current) return
    const next = fn(latest.current)
    latest.current = next
    setData(next)
    set(KEY, next)
  }, [])

  if (!data) return null
  return <StoreContext.Provider value={{ data, update }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const s = useContext(StoreContext)
  if (!s) throw new Error('StoreProvider fehlt')
  return s
}

export const uid = () => crypto.randomUUID()

export function isAppData(x: unknown): x is AppData {
  const d = x as AppData
  return !!d && Array.isArray(d.workouts) && Array.isArray(d.sessions)
}
