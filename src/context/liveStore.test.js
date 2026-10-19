import { act, renderHook, waitFor } from '@testing-library/react'
import { useLive, closeAllLive } from './liveStore'
import * as db from '../services/testUtils/fakeFirebase'

jest.mock('../firebase', () => require('../services/testUtils/fakeFirebase'))

beforeEach(() => {
  closeAllLive()
  db.reset({ maftb: { info: { currentSeason: "Season 1" } } })
})

test("loads a path", async () => {
  const { result } = renderHook(() => useLive("maftb/info"))
  expect(result.current).toMatchObject({ loaded: false, value: null })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  expect(result.current.value).toEqual({ currentSeason: "Season 1" })
})

test("reports nothing at a path as null", async () => {
  const { result } = renderHook(() => useLive("maftb/doinkfund"))
  await waitFor(() => expect(result.current.loaded).toBe(true))
  expect(result.current.value).toBeNull()
})

test("does nothing without a path", () => {
  const { result } = renderHook(() => useLive(null))
  expect(result.current).toMatchObject({ loaded: false, value: null })
})

test("follows changes made to the data", async () => {
  const { result } = renderHook(() => useLive("maftb/info"))
  await waitFor(() => expect(result.current.loaded).toBe(true))
  act(() => db.write("maftb/info/currentSeason", "Season 2"))
  await waitFor(() => expect(result.current.value.currentSeason).toBe("Season 2"))
})

test("shows only the latest of a burst of writes", async () => {
  const seen = []
  const { result } = renderHook(() => {
    const snapshot = useLive("maftb/info")
    seen.push(snapshot.value?.currentSeason)
    return snapshot
  })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  act(() => {
    db.write("maftb/info/currentSeason", "Season 2")
    db.write("maftb/info/currentSeason", "Season 3")
    db.write("maftb/info/currentSeason", "Season 4")
  })
  await waitFor(() => expect(result.current.value.currentSeason).toBe("Season 4"))
  expect(seen).not.toContain("Season 2")
  expect(seen).not.toContain("Season 3")
})

test("components using the same path share one listener, and it outlives them for a while", async () => {
  const listenToPath = jest.spyOn(db, "listenToPath")
  const { unmount: leaveFirst } = renderHook(() => useLive("maftb/info"))
  const { result, unmount: leaveSecond } = renderHook(() => useLive("maftb/info"))
  await waitFor(() => expect(result.current.loaded).toBe(true))
  expect(listenToPath).toHaveBeenCalledTimes(1)

  // Going to another page and coming back finds the data already there, without listening again
  leaveFirst()
  leaveSecond()
  const { result: returned } = renderHook(() => useLive("maftb/info"))
  expect(returned.current.loaded).toBe(true)
  expect(listenToPath).toHaveBeenCalledTimes(1)
  listenToPath.mockRestore()
})

test("stops listening to a path nobody has used for a while", async () => {
  jest.useFakeTimers()
  try {
    const listenToPath = jest.spyOn(db, "listenToPath")
    const { unmount } = renderHook(() => useLive("maftb/info"))
    await act(async () => { await Promise.resolve() })
    unmount()
    act(() => { jest.advanceTimersByTime(6 * 60 * 1000) })

    renderHook(() => useLive("maftb/info"))
    expect(listenToPath).toHaveBeenCalledTimes(2)
    listenToPath.mockRestore()
  } finally {
    jest.useRealTimers()
  }
})
