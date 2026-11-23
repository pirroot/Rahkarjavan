'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'

export function useAuth() {
  const { user, setUser, loadingUser, setLoadingUser } = useStore()

  useEffect(() => {
    let mounted = true
    setLoadingUser(true)
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (mounted) {
          setUser(d.user ?? null)
        }
      })
      .catch(() => {
        if (mounted) setUser(null)
      })
      .finally(() => {
        if (mounted) setLoadingUser(false)
      })
    return () => {
      mounted = false
    }
  }, [setUser, setLoadingUser])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    useStore.getState().navigate('home')
  }

  return { user, loadingUser, logout }
}

export function useSettings() {
  const { settings, setSettings } = useStore()
  useEffect(() => {
    if (Object.keys(settings).length === 0) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((d) => setSettings(d.settings || {}))
        .catch(() => {})
    }
  }, [settings, setSettings])
  return settings
}

export function useFetch<T>(url: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setData(null)
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    setError(null)
    fetch(url)
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'خطا در دریافت اطلاعات')
        if (mounted) setData(json)
      })
      .catch((e) => {
        if (mounted) setError(e.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])

  return { data, loading, error }
}
