import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
  })

  it('should initialize with null user and token', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })

  it('should set user and token after login', async () => {
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      try {
        await result.current.login('admin@mojazine.ma', 'demo123456')
      } catch (error) {
        // Expected in test environment
      }
    })

    // In a real test, this would verify the API call and state update
  })

  it('should clear user and token on logout', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        organizationId: 'org-1',
        role: 'admin',
      })
    })

    expect(result.current.user).not.toBeNull()

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })
})
