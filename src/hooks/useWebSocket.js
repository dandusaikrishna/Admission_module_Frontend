import { useState, useEffect, useCallback, useRef } from 'react'

const RECONNECT_INTERVAL = 5000 // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 10

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [data, setData] = useState(null)
  const wsRef = useRef(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef(null)

  const getWebSocketURL = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws`
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const wsURL = getWebSocketURL()
      wsRef.current = new WebSocket(wsURL)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectCountRef.current = 0
        
        // Send initial ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000) // Every 30 seconds

        wsRef.current.pingInterval = pingInterval
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          setData(message)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        
        // Clear ping interval
        if (wsRef.current && wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval)
        }

        // Attempt to reconnect
        if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectCountRef.current += 1
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectCountRef.current}/${MAX_RECONNECT_ATTEMPTS})...`)
            connect()
          }, RECONNECT_INTERVAL)
        }
      }
    } catch (err) {
      console.error('Error connecting to WebSocket:', err)
      setIsConnected(false)
    }
  }, [getWebSocketURL])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current && wsRef.current.pingInterval) {
      clearInterval(wsRef.current.pingInterval)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    isConnected,
    data,
    reconnect: connect
  }
}
