import AsyncStorage from '@react-native-async-storage/async-storage'

class DataService {
  private store = new Map<string, any>()

  async get(path: string): Promise<any> {
    // try in-memory cache first
    if (this.store.has(path)) return this.store.get(path)
    // try AsyncStorage fallback
    try {
      const raw = await AsyncStorage.getItem(path)
      if (raw != null) {
        const v = JSON.parse(raw)
        this.store.set(path, v)
        return v
      }
    } catch (e) {
      // ignore and return null
    }
    return null
  }

  async set(path: string, value: any): Promise<void> {
    this.store.set(path, value)
    try {
      await AsyncStorage.setItem(path, JSON.stringify(value))
    } catch (e) {
      // ignore storage errors
    }
  }

  async remove(path: string): Promise<void> {
    this.store.delete(path)
    try {
      await AsyncStorage.removeItem(path)
    } catch (e) {
      // ignore
    }
  }

  /**
   * Construye la URL base para las consultas a la API.
   * domain: base URL (ej: https://api.example.com)
   * table: nombre del recurso/tabla (ej: users)
   * id: opcional, id del recurso
   * query: cadena de consulta ya serializada (ej: "limit=10&offset=0")
   */
  private buildUrl(domain: string, table: string, id?: string, query?: string) {
    const encodeSegments = (s: string) => s.split('/').map(encodeURIComponent).join('/')
    let url = domain.replace(/\/$/, '') + '/' + encodeSegments(table)
    if (id) url += '/' + (id)
    if (query) url += '/search' + (url.includes('?') ? '&' : '?') + query;
    return url += (url.includes('?') ? '&' : '?') + 'ver=' + Date.now()
  }

  /**
   * Consulta GET genérica a una API.
   * domain: base URL
   * table: recurso/tabla
   * id: opcional, id del registro
   * query: opcional, query string sin el `?`
   */
  async apiGet(domain: string, table: string, id?: string, query?: string): Promise<any> {
    const url = this.buildUrl(domain, table, id, query)

    try {
      const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`GET ${url} failed (${res.status}): ${text}`)
      }
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) return await res.json()
      return await res.text()
    } catch (err) {
      throw err
    }
  }

  /**
   * POST genérico a una API.
   * domain: base URL
   * table: recurso/tabla
   * body: payload a enviar
   * id: opcional, id del recurso (p. ej. para endpoints como /table/:id/action)
   * query: opcional, query string sin el `?`
   */
  async apiPost(domain: string, table: string, body: any, id?: string, query?: string): Promise<any> {
    const url = this.buildUrl(domain, table, id, query);
    console.log('DataService.apiPost called with:', { domain, table, body, id, query });
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`POST ${url} failed (${res.status}): ${text}`)
      }
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) return await res.json()
      return await res.text()
    } catch (err) {
      throw err
    }
  }

  /**
   * PUT genérico a una API.
   * domain: base URL
   * table: recurso/tabla
   * body: payload a enviar
   * id: opcional, id del recurso (ej. /table/:id)
   * query: opcional, query string sin el `?`
   */
  async apiPut(domain: string, table: string, body: any, id?: string, query?: string): Promise<any> {
    
    // console.log('DataService.apiPut called with:', { domain, table, body, id, query });
    const url = this.buildUrl(domain, table, id, query)

    // console.log('DataService.apiPut url:', url, 'body:', body);
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`PUT ${url} failed (${res.status}): ${text}`)
      }
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) return await res.json()
      return await res.text()
    } catch (err) {
      throw err
    }
  }

  /**
   * DELETE genérico a una API.
   * domain: base URL
   * table: recurso/tabla
   * id: opcional, id del registro
   * query: opcional, query string sin el `?`
   */
  async apiDelete(domain: string, table: string, id?: string, query?: string): Promise<any> {
    const url = this.buildUrl(domain, table, id, query)
    try {
      const res = await fetch(url, { method: 'DELETE', headers: { Accept: 'application/json' } })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`DELETE ${url} failed (${res.status}): ${text}`)
      }
      if (res.status === 204) return null
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) return await res.json()
      return await res.text()
    } catch (err) {
      throw err
    }
  }

}

export default new DataService()
