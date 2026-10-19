import { useCallback, useSyncExternalStore } from 'react'
import { listenToPath } from '../firebase'

// One live copy of each database path, shared by every component that uses it. A path is downloaded the first time
// something asks for it, then only the changes that follow are sent, so the data is always current and visiting
// another page doesn't read it again. A path nobody is using any more keeps listening for a few minutes (so
// going back to a page is instant) and is then dropped.
const KEEP_ALIVE_MS = 5 * 60 * 1000
// A season rebuild writes many records in a row; screens are updated once per burst instead of once per write
const BURST_MS = 250

export const NOT_LOADED = Object.freeze({ value: null, loaded: false, error: false })

const entries = new Map()

const publish = (entry, snapshot) => {
  entry.snapshot = snapshot
  entry.subscribers.forEach(notify => notify())
}

const receive = (entry, value) => {
  entry.latest = { value, loaded: true, error: false }
  if (!entry.snapshot.loaded) return publish(entry, entry.latest)
  if (entry.burstTimer) return
  entry.burstTimer = setTimeout(() => {
    entry.burstTimer = null
    publish(entry, entry.latest)
  }, BURST_MS)
}

const open = (path) => {
  const entry = { snapshot: NOT_LOADED, latest: NOT_LOADED, subscribers: new Set(), stop: null, dropTimer: null, burstTimer: null }
  entry.stop = listenToPath(path, value => receive(entry, value), () => publish(entry, { value: null, loaded: true, error: true }))
  entries.set(path, entry)
  return entry
}

const close = (path) => {
  const entry = entries.get(path)
  if (!entry) return
  clearTimeout(entry.burstTimer)
  entry.stop && entry.stop()
  entries.delete(path)
}

const subscribeTo = (path, notify) => {
  const entry = entries.get(path) || open(path)
  clearTimeout(entry.dropTimer)
  entry.subscribers.add(notify)
  return () => {
    entry.subscribers.delete(notify)
    if (entry.subscribers.size === 0) entry.dropTimer = setTimeout(() => close(path), KEEP_ALIVE_MS)
  }
}

// { value, loaded, error } for a database path. `value` is null while loading and when there's nothing at the path;
// pass a falsy path to use nothing (e.g. before a league is chosen).
export const useLive = (path) => {
  const subscribe = useCallback(notify => (path ? subscribeTo(path, notify) : () => {}), [path])
  const getSnapshot = useCallback(() => (path ? entries.get(path)?.snapshot || NOT_LOADED : NOT_LOADED), [path])
  return useSyncExternalStore(subscribe, getSnapshot)
}


// Stops every listener and forgets what they held (for tests, so one doesn't see the last one's data)
export const closeAllLive = () => [...entries.keys()].forEach(close)
