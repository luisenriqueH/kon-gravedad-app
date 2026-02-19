export type User = {
  id: string
  rol: string
  email?: string
  emailVerified?: boolean
  createdAt?: string
  lastLogin?: string
}

import DataService from './DataService'

export class AuthService {
  // static API_BASE = 'http://localhost:3001/api/kaiman'
  static API_BASE = 'https://koningo.com/api/kaiman'

  setBaseUrl(url: string) {
    AuthService.API_BASE = url
  }
  getBaseUrl() {
    return AuthService.API_BASE
  }

  private user: User | null = null

  /**
   * Intenta restaurar la sesión desde almacenamiento local si el token
   * fue guardado hace menos de 1 semana. Devuelve el `User` o `null`.
   */
  async tryRestoreSession(): Promise<User | null> {
    try {
      const saved = await DataService.get('authToken')
      if (!saved || !saved.token || !saved.timestamp) return null
      const age = Date.now() - Number(saved.timestamp)
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      if (age > oneWeek) {
        await DataService.remove('authToken')
        return null
      }
      // restore cached user (may be minimal)
      this.user = saved.user ?? null
      return this.user
    } catch (e) {
      return null
    }
  }

  // synchronous getter used by AuthProvider
  getUser(): User | null {
    return this.user
  }

  signOut(): void {
    this.user = null
    try { DataService.remove('authToken') } catch {}
  }

  private async parseJson(res: Response) {
    const text = await res.text()
    try {
      return text ? JSON.parse(text) : null
    } catch {
      return text
    }
  }

  private mapUser(body: any): User | null {
    if (!body) return null
    const src = Array.isArray(body) ? body[0] : body
    if (!src) return null
    return {
      id: String(
        src.id ?? src.ID ?? src.id_cliente ?? src.clientId ?? src.insertId ?? src.insertedId ?? '',
      ),
      rol: String(src.rol ?? src.role ?? src.rol_cliente ?? 'user'),
      email: src.correo ?? src.email ?? undefined,
      emailVerified:
        src.correo_verificado === 1 || src.correo_verificado === true || undefined,
      createdAt: src.fecha_creacion ?? src.createdAt ?? undefined,
      lastLogin: src.fecha_ultima_conexion ?? src.lastLogin ?? undefined,
    }
  }

  // Create client
  async createClient(correo: string, clave: string): Promise<User> {
    const url = `${AuthService.API_BASE}/auth/clients`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, clave }),
    })
    const body = await this.parseJson(res)
    const msg = typeof body === 'string' ? body : (body && (body.message || body.error)) || `HTTP ${res.status}`
    if (!res.ok) throw new Error(msg)
    const user = this.mapUser(body)
    if (!user) throw new Error('Invalid response from server')
    this.user = user

    // try to extract token from response and persist session
    try {
      const token = this.extractTokenFromResponse(body)
      if (token) {
        await DataService.set('authToken', { token, timestamp: Date.now(), user })
      }
    } catch {}
    return user
  }

  // Verify email
  async verifyEmail(id: string): Promise<User> {
    const url = `${AuthService.API_BASE}/auth/clients/${encodeURIComponent(id)}/verify`
    const res = await fetch(url, { method: 'POST' })
    const body = await this.parseJson(res)
    const msg = typeof body === 'string' ? body : (body && (body.message || body.error)) || `HTTP ${res.status}`
    if (!res.ok) throw new Error(msg)
    const user = this.mapUser(body)
    if (!user) throw new Error('Not found')
    return user
  }

  // Change email (requires current password)
  async changeEmail(id: string, currentPassword: string, newEmail: string): Promise<User> {
    const url = `${AuthService.API_BASE}/auth/clients/${encodeURIComponent(id)}/change-email`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newEmail }),
    })
    const body = await this.parseJson(res)
    const msg = typeof body === 'string' ? body : (body && (body.message || body.error)) || `HTTP ${res.status}`
    if (!res.ok) throw new Error(msg)
    const user = this.mapUser(body)
    if (!user) throw new Error('Not found')
    if (this.user && this.user.id === user.id) this.user = user
    // update persisted session user if present
    try {
      const saved = await DataService.get('authToken')
      if (saved && saved.token) {
        saved.user = this.user
        await DataService.set('authToken', saved)
      }
    } catch {}
    return user
  }

  // Change password (requires current password)
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const url = `${AuthService.API_BASE}/auth/clients/${encodeURIComponent(id)}/change-password`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const body = await this.parseJson(res)
    const msg = typeof body === 'string' ? body : (body && (body.message || body.error)) || `HTTP ${res.status}`
    if (!res.ok) throw new Error(msg)
    return true
  }

  // Login
  async signIn(correo: string, clave: string): Promise<User> {
    const url = `${AuthService.API_BASE}/auth/login`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, clave }),
    })
    const body = await this.parseJson(res)
    const msg = typeof body === 'string' ? body : (body && (body.message || body.error)) || `HTTP ${res.status}`
    if (!res.ok) throw new Error(msg)
    const user = this.mapUser(body)
    if (!user) throw new Error('Invalid credentials')
    this.user = user

    // extract and persist token for future automatic sign-in
    try {
      const token = this.extractTokenFromResponse(body)
      if (token) {
        await DataService.set('authToken', { token, timestamp: Date.now(), user })
      }
    } catch {}
    return user
  }

  // Close account (delete) — requires current password
  async deleteAccount(id: string, currentPassword: string): Promise<boolean> {
    const url = `${AuthService.API_BASE}/auth/clients/${encodeURIComponent(id)}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword }),
    })
    const body = await this.parseJson(res)
    const msg = typeof body === 'string' ? body : (body && (body.message || body.error)) || `HTTP ${res.status}`
    if (!res.ok) throw new Error(msg)
    if (this.user && this.user.id === String(id)) this.user = null
    // clear persisted session
    try { DataService.remove('authToken') } catch {}
    return true
  }

  /**
   * Extrae un token de distintos formatos comunes en la respuesta.
   */
  private extractTokenFromResponse(body: any): string | null {
    if (!body) return null
    const candidates = (obj: any) => {
      if (!obj || typeof obj !== 'object') return null
      return (
        obj.token ?? obj.accessToken ?? obj.access_token ?? obj.jwt ?? obj.tokenJWT ?? obj.api_token ?? obj.token_access ?? null
      )
    }
    let token = candidates(body)
    if (!token && Array.isArray(body) && body[0]) token = candidates(body[0])
    return token ? String(token) : null
  }
}

export default new AuthService()
