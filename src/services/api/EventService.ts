import DataService from './DataService'

class EventService {
  async listEvents(domain: string, query?: string) {
    const table = `events`
    return DataService.apiGet(domain, table, undefined, query)
  }

  async searchEvents(domain: string, query?: string) {
    const table = `events`
    return DataService.apiGet(domain, table, undefined, query)
  }

  async getEvent(domain: string, id: string | number) {
    const table = `events`
    return DataService.apiGet(domain, table, String(id))
  }

  async createEvent(domain: string, body: any) {
    console.log('Creating event with body:', body);
    const table = `events/create`
    return DataService.apiPost(domain, table, body)
  }

  async updateEvent(domain: string, id: string | number, body: any) {
    const table = `events`
    return DataService.apiPut(domain, table, body, String(id))
  }

  async deleteEvent(domain: string, id: string | number) {
    const table = `events`
    return DataService.apiDelete(domain, table, String(id))
  }

  
}

export default new EventService()
