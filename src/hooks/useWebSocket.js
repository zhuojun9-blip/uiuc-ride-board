import { useEffect, useRef, useCallback, useState } from 'react'

const backendHttpUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')
const wsBaseUrl = (
  import.meta.env.VITE_WS_URL || backendHttpUrl.replace(/^http/i, 'ws')
).replace(/\/$/, '')

export const useWebSocket = (token, onMessage, onNotification) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const ws = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (!token) return

    const connectWebSocket = () => {
      try {
        const wsUrl = `${wsBaseUrl}/ws/notifications/${token}`
        
        ws.current = new WebSocket(wsUrl)

        ws.current.onopen = () => {
          setConnectionStatus('connected')
          reconnectAttempts.current = 0
          // Send initial ping to keep connection alive
          sendPing()
        }

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Handle different message types
            if (data.type === 'pong') {
              // Keep-alive response
              setTimeout(sendPing, 30000)
            } else if (['new_message', 'driver_contacted', 'ride_offered', 'user_online', 'user_offline'].includes(data.type)) {
              // Notification
              onNotification?.(data)
            } else {
              // Regular message
              onMessage?.(data)
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e)
          }
        }

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error)
          setConnectionStatus('error')
        }

        ws.current.onclose = () => {
          setConnectionStatus('disconnected')

          // Attempt to reconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1
            const delay = 1000 * Math.pow(2, reconnectAttempts.current - 1)
            setTimeout(connectWebSocket, delay)
          }
        }
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        setConnectionStatus('error')
      }
    }

    connectWebSocket()

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close()
      }
    }
  }, [token, onMessage, onNotification])

  const sendPing = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'ping' }))
    }
  }, [])

  const sendMessage = useCallback((recipientId, subject, body) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'message',
        recipient_id: recipientId,
        subject,
        body,
        timestamp: new Date().toISOString()
      }))
    }
  }, [])

  const contactDriver = useCallback((driverId, route, message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'contact_driver',
        driver_id: driverId,
        route,
        message,
        timestamp: new Date().toISOString()
      }))
    }
  }, [])

  const offerRide = useCallback((riderId, route, departureTime) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'offer_ride',
        rider_id: riderId,
        route,
        departure_time: departureTime,
        timestamp: new Date().toISOString()
      }))
    }
  }, [])

  return {
    connectionStatus,
    sendMessage,
    contactDriver,
    offerRide
  }
}
