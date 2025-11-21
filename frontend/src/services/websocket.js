class VideoWebSocketService {
  constructor() {
    this.ws = null
    this.connectionStatus = 'disconnected'
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.listeners = {
      segmentation: [],
      dinov3: [],
      connection: [],
      error: []
    }
  }

  connect(url = 'ws://localhost:8000/ws/video') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.connectionStatus = 'connected'
        this.reconnectAttempts = 0
        this.emit('connection', { status: 'connected' })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Route messages based on type
          switch (data.type) {
            case 'segmentation':
              this.emit('segmentation', data.payload)
              break
            case 'dinov3':
              this.emit('dinov3', data.payload)
              break
            case 'error':
              this.emit('error', data.payload)
              break
            default:
              console.warn('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', { message: 'WebSocket connection error' })
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.connectionStatus = 'disconnected'
        this.emit('connection', { status: 'disconnected' })

        // Attempt reconnection if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect()
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.emit('error', { message: 'Failed to create WebSocket connection' })
    }
  }

  reconnect() {
    this.reconnectAttempts++
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  sendFrame(frameData, timestamp = Date.now()) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected')
      return false
    }

    try {
      const message = {
        type: 'frame',
        timestamp,
        data: frameData
      }

      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Error sending frame:', error)
      return false
    }
  }

  sendVideoBlob(blob, metadata = {}) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected')
      return false
    }

    try {
      // For larger binary data, send as binary
      const reader = new FileReader()
      reader.onload = () => {
        // Send metadata first
        this.ws.send(JSON.stringify({
          type: 'video_metadata',
          ...metadata
        }))

        // Then send binary data
        this.ws.send(reader.result)
      }
      reader.readAsArrayBuffer(blob)
      return true
    } catch (error) {
      console.error('Error sending video blob:', error)
      return false
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
      this.connectionStatus = 'disconnected'
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Export a singleton instance
export default new VideoWebSocketService()