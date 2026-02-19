import AuthService from './AuthService'
import DataService from './DataService'

class PersonService {
  async getPeople(domain: string, query?: string) {
    const table = `persons`
    return DataService.apiGet(domain, table, undefined, query)
  }

  async searchPeople(domain: string, query?: string) {
    const table = `persons/search`
    return DataService.apiGet(domain, table, undefined, query)
  }

  async getPerson(domain: string, id: string) {
    const table = `persons`
    return DataService.apiGet(domain, table, id)
  }

  async createPerson(body: any) {
    const domain = AuthService.getBaseUrl();
    const table = `persons`
    return DataService.apiPost(domain, table, body)
  }

  async updatePerson(id: string, body: any) {
    const table = `persons`
    const domain = AuthService.getBaseUrl();
    console.log('Updating person with body:', domain,body);
    return DataService.apiPut(domain, table, body, id)
  }

  async deletePerson(domain: string, id: string) {
    const table = `persons`
    return DataService.apiDelete(domain, table, id)
  }

  async listProducts(domain: string, personId: string) {
    const table = `persons/${personId}/products`
    return DataService.apiGet(domain, table)
  }

  async associateProduct(domain: string, personId: string, productId: number, role?: string) {
    const table = `persons/${personId}/products`
    const body = { product_id: productId, role }
    return DataService.apiPost(domain, table, body)
  }

  async removeProductAssociation(domain: string, personId: string, productId: number) {
    const table = `persons/${personId}/products`
    return DataService.apiDelete(domain, table, String(productId))
  }

  async findPersonByOwner(domain: string, ownerId: string) {
    const table = `persons`
    const q = `owner=${encodeURIComponent(ownerId)}`


    try {
      const res = await DataService.apiGet(domain, table, undefined, q)
      return res
    } catch (e) {
      return null
    }
  }
}

export default new PersonService()
