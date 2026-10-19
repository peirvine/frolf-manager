import { renderHook, act } from '@testing-library/react'
import useWindowDimensions from './windowSize'

const resizeTo = (width, height) => {
  window.innerWidth = width
  window.innerHeight = height
  window.dispatchEvent(new Event('resize'))
}

test("tracks the window size as it changes", () => {
  resizeTo(1024, 768)
  const { result } = renderHook(() => useWindowDimensions())
  expect(result.current).toEqual({ width: 1024, height: 768 })

  act(() => resizeTo(375, 812))
  expect(result.current).toEqual({ width: 375, height: 812 })
})

test("stops listening when unmounted", () => {
  const remove = jest.spyOn(window, 'removeEventListener')
  const { unmount } = renderHook(() => useWindowDimensions())
  unmount()
  expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
  remove.mockRestore()
})
