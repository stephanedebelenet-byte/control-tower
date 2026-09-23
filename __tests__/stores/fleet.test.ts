import { renderHook, act } from '@testing-library/react'
import { useFleetStore } from '@/stores/fleet'

describe('useFleetStore', () => {
  it('should initialize with empty vehicles', () => {
    const { result } = renderHook(() => useFleetStore())
    expect(result.current.vehicles).toEqual([])
    expect(result.current.totalActive).toBe(0)
  })

  it('should update vehicles', () => {
    const { result } = renderHook(() => useFleetStore())

    const mockVehicles = [
      {
        id: '1',
        plateNumber: 'TMS-001',
        status: 'active',
        currentWeight: 5,
        capacity: 12,
        currentLocation: '35.9425,-5.3211',
        speed: 75,
      },
      {
        id: '2',
        plateNumber: 'TMS-002',
        status: 'idle',
        currentWeight: 0,
        capacity: 12,
        currentLocation: '33.2639,-8.6328',
        speed: 0,
      },
    ]

    act(() => {
      result.current.setVehicles(mockVehicles)
    })

    expect(result.current.vehicles).toEqual(mockVehicles)
    expect(result.current.totalActive).toBe(1)
    expect(result.current.totalCapacity).toBe(24)
  })

  it('should update vehicle location', () => {
    const { result } = renderHook(() => useFleetStore())

    const mockVehicles = [
      {
        id: '1',
        plateNumber: 'TMS-001',
        status: 'active',
        currentWeight: 5,
        capacity: 12,
        currentLocation: '35.9425,-5.3211',
        speed: 75,
      },
    ]

    act(() => {
      result.current.setVehicles(mockVehicles)
    })

    act(() => {
      result.current.updateVehicleLocation('1', '35.9500,-5.3300', 80)
    })

    const updated = result.current.vehicles.find((v) => v.id === '1')
    expect(updated?.currentLocation).toBe('35.9500,-5.3300')
    expect(updated?.speed).toBe(80)
  })
})
