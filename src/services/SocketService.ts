class SocketService {
  private socket: WebSocket | null = null
  private onMsg?: (data: any) => void

  connect(url: string): void {
    if (this.socket) this.close()
    this.socket = new WebSocket(url)
    this.socket.onmessage = (ev) => {
      let data = ev.data
      try {
        data = JSON.parse(ev.data as string)
      } catch (_) {}
      this.onMsg?.(data)
    }
  }

  onMessage(cb: (data: any) => void): void {
    this.onMsg = cb
  }

  send(data: any): void {
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }

  close(): void {
    this.socket?.close()
    this.socket = null
  }
}

export default new SocketService()
