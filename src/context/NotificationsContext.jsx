import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  clearNotifications,
  deleteNotification,
  getMyNotifications,
  markAllAsRead,
  markAsRead,
} from '../api/notifications'

// The customer's notifications, shared by the header bell and the notifications page so
// the badge and the list always agree. The backend sends a plain array with no totals,
// so the unread count is worked out from what has been loaded, and a full page means
// there may be more to load.
const PAGE_SIZE = 50
const NOT_FOUND = 'Notification not found'

const NotificationsContext = createContext(null)

const messageOf = (err) => err.response?.data?.message ?? err.message

export function NotificationsProvider({ children }) {
  const { pathname } = useLocation()
  const [state, setState] = useState({ status: 'loading', items: [], error: '', hasMore: false })
  const pageRef = useRef(1)
  const latest = useRef(0) // which refresh is the newest; older answers are ignored

  // Loads the first page again. On a first load a failure becomes the error state; once
  // there is something to show, a failed refresh keeps it.
  const refresh = useCallback(async () => {
    const id = ++latest.current
    try {
      const res = await getMyNotifications({ page: 1, limit: PAGE_SIZE })
      if (id !== latest.current) return
      pageRef.current = 1
      setState({ status: 'ready', items: res.data, error: '', hasMore: res.data.length === PAGE_SIZE })
    } catch (err) {
      if (id !== latest.current) return
      setState((current) =>
        current.status === 'ready' ? current : { status: 'error', items: [], error: messageOf(err), hasMore: false },
      )
    }
  }, [])

  // Load on first render, and again when the customer moves to another page.
  useEffect(() => {
    refresh()
  }, [refresh, pathname])

  // Retry after an error: back to loading, then load.
  const retry = useCallback(() => {
    setState({ status: 'loading', items: [], error: '', hasMore: false })
    return refresh()
  }, [refresh])

  // Adds the next page to the list. Rejects with the backend's error to show.
  const loadMore = useCallback(async () => {
    const next = pageRef.current + 1
    const res = await getMyNotifications({ page: next, limit: PAGE_SIZE })
    pageRef.current = next
    setState((current) => {
      const known = new Set(current.items.map((n) => n._id))
      return {
        ...current,
        items: [...current.items, ...res.data.filter((n) => !known.has(n._id))],
        hasMore: res.data.length === PAGE_SIZE,
      }
    })
  }, [])

  const patch = (id, fields) =>
    setState((current) => ({
      ...current,
      items: current.items.map((n) => (n._id === id ? { ...n, ...fields } : n)),
    }))

  const drop = (id) => setState((current) => ({ ...current, items: current.items.filter((n) => n._id !== id) }))

  // Marks one as read right away, and undoes that if the backend says no. Rejects
  // with the error so the caller can tell the customer.
  const markRead = useCallback(async (id) => {
    patch(id, { isRead: true })
    try {
      await markAsRead(id)
    } catch (err) {
      if (messageOf(err) === NOT_FOUND) drop(id)
      else patch(id, { isRead: false })
      throw err
    }
  }, [])

  const markAllRead = useCallback(async () => {
    await markAllAsRead()
    setState((current) => ({ ...current, items: current.items.map((n) => ({ ...n, isRead: true })) }))
  }, [])

  // A notification that is already gone counts as deleted.
  const remove = useCallback(async (id) => {
    try {
      await deleteNotification(id)
    } catch (err) {
      if (messageOf(err) !== NOT_FOUND) throw err
    }
    drop(id)
  }, [])

  const clearAll = useCallback(async () => {
    await clearNotifications()
    setState((current) => ({ ...current, items: [], hasMore: false }))
  }, [])

  const { status, items, error, hasMore } = state
  const unread = useMemo(() => items.filter((n) => !n.isRead).length, [items])

  const value = useMemo(
    () => ({ status, items, error, hasMore, unread, refresh, retry, loadMore, markRead, markAllRead, remove, clearAll }),
    [status, items, error, hasMore, unread, refresh, retry, loadMore, markRead, markAllRead, remove, clearAll],
  )
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return ctx
}
