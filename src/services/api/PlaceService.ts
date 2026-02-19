import AuthService from './AuthService'
import DataService from './DataService'
import { Place } from '../../models/place.model'

class PlaceService {
  async listPlaces(domain: string, query?: string): Promise<Place[] | any> {
    const table = `places`
    return DataService.apiGet(domain, table, undefined, query)
  }

  async searchPlaces(domain: string, query?: string): Promise<Place[] | any> {
    const table = `places/search`
    return DataService.apiGet(domain, table, undefined, query)
  }

  async getPlace(domain: string, id: string | number): Promise<Place | any> {
    const table = `places`
    return DataService.apiGet(domain, table, String(id))
  }

  async createPlace(body: Partial<Place>): Promise<Place | any> {
    const domain = AuthService.getBaseUrl();
    const table = `places/create`
    return DataService.apiPost(domain, table, body)
  }

  async updatePlace(id: string | number, body: Partial<Place>): Promise<Place | any> {
    const table = `places`
    const domain = AuthService.getBaseUrl();
    console.log('Updating place with body:', domain, body);
    return DataService.apiPut(domain, table, body, String(id))
  }

  async deletePlace(domain: string, id: string | number): Promise<any> {
    const table = `places`
    return DataService.apiDelete(domain, table, String(id))
  }

  async findPlaceByOwner(domain: string, ownerId: string): Promise<Place | null | any> {
    const table = `places`
    const q = `owner=${encodeURIComponent(ownerId)}`

    try {
      const res = await DataService.apiGet(domain, table, undefined, q)
      console.log('findPlaceByOwner response:', res);
      return res
    } catch (e) {
      return null
    }
  }
}

export default new PlaceService()
