'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface ForecourtEvent {
  type: string
  data: unknown
  timestamp: string
}

export function useForecourtWS() {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<ForecourtEvent[]>([])
  const [dispenserUpdates, setDispenserUpdates] = useState<Record<string, unknown>>({})
  const [tankUpdates, setTankUpdates] = useState<Record<string, unknown>>({})
  const [latestAlert, setLatestAlert] = useState<Record<string, unknown> | null>(null)
  const [rfidScans, setRfidScans] = useState<Record<string, unknown>[]>([])
  const [anprDetections, setAnprDetections] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      console.log('Forecourt WS connected')
    })

    socket.on('disconnect', () => {
      setConnected(false)
      console.log('Forecourt WS disconnected')
    })

    socket.on('forecourt:init', (data) => {
      setDispenserUpdates(data)
    })

    socket.on('dispenser:status', (data) => {
      setDispenserUpdates(prev => ({ ...prev, [data.pumpId]: data }))
      setEvents(prev => [{ type: 'dispenser:status', data, timestamp: data.timestamp || new Date().toISOString() }, ...prev.slice(0, 49)])
    })

    socket.on('dispenser:complete', (data) => {
      setDispenserUpdates(prev => ({ ...prev, [data.pumpId]: data }))
      setEvents(prev => [{ type: 'dispenser:complete', data, timestamp: data.completedAt || new Date().toISOString() }, ...prev.slice(0, 49)])
    })

    socket.on('tank:update', (data) => {
      setTankUpdates(prev => ({ ...prev, [data.tankId]: data }))
      setEvents(prev => [{ type: 'tank:update', data, timestamp: data.timestamp }, ...prev.slice(0, 49)])
    })

    socket.on('atg:reading', (data) => {
      setTankUpdates(prev => ({ ...prev, [data.tankId]: data }))
      setEvents(prev => [{ type: 'atg:reading', data, timestamp: data.timestamp }, ...prev.slice(0, 49)])
    })

    socket.on('rfid:scan', (data) => {
      setRfidScans(prev => [data, ...prev.slice(0, 19)])
      setEvents(prev => [{ type: 'rfid:scan', data, timestamp: data.timestamp }, ...prev.slice(0, 49)])
    })

    socket.on('anpr:detection', (data) => {
      setAnprDetections(prev => [data, ...prev.slice(0, 19)])
      setEvents(prev => [{ type: 'anpr:detection', data, timestamp: data.timestamp }, ...prev.slice(0, 49)])
    })

    socket.on('ai:alert', (data) => {
      setLatestAlert(data)
      setEvents(prev => [{ type: 'ai:alert', data, timestamp: data.timestamp }, ...prev.slice(0, 49)])
    })

    socket.on('price:updated', (data) => {
      setEvents(prev => [{ type: 'price:updated', data, timestamp: data.timestamp }, ...prev.slice(0, 49)])
    })

    socket.on('emergency:stopped', (data) => {
      setEvents(prev => [{ type: 'emergency:stopped', data, timestamp: data.timestamp }, ...prev.slice(0, 49)])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const authorizePump = useCallback((pumpId: string) => {
    socketRef.current?.emit('dispenser:authorize', { pumpId, userId: 'manager' })
  }, [])

  const stopPump = useCallback((pumpId: string) => {
    socketRef.current?.emit('dispenser:stop', { pumpId, userId: 'manager' })
  }, [])

  const lockPump = useCallback((pumpId: string) => {
    socketRef.current?.emit('dispenser:lock', { pumpId, userId: 'manager' })
  }, [])

  const unlockPump = useCallback((pumpId: string) => {
    socketRef.current?.emit('dispenser:unlock', { pumpId, userId: 'manager' })
  }, [])

  const emergencyStop = useCallback(() => {
    socketRef.current?.emit('emergency:stop')
  }, [])

  const updatePrice = useCallback((fuelType: string, newPrice: number) => {
    socketRef.current?.emit('price:update', { fuelType, newPrice, updatedBy: 'manager' })
  }, [])

  return {
    connected,
    events,
    dispenserUpdates,
    tankUpdates,
    latestAlert,
    rfidScans,
    anprDetections,
    authorizePump,
    stopPump,
    lockPump,
    unlockPump,
    emergencyStop,
    updatePrice,
  }
}
