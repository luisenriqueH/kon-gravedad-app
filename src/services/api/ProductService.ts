import DataService from './DataService'

class ProductService {
  /**
   * Upload a single product to the backend. Uses POST /products/upload
   * domain: base API url (eg. https://api.example.com)
   */
  async uploadProduct(domain: string, product: any): Promise<any> {
    // DataService.apiPost(domain, table, body, id)
    return DataService.apiPost(domain, 'products', product, 'upload')
  }

  /**
   * Update an existing product by id. Uses PUT /products/:id
   */
  async updateProduct(domain: string, id: string | number, product: any): Promise<any> {
    return DataService.apiPut(domain, 'products', product, String(id))
  }

  async getProduct(domain: string, id: string | number): Promise<any> {
    return DataService.apiGet(domain, 'products', String(id))
  }

  async listProducts(domain: string, query?: string): Promise<any> {
    return DataService.apiGet(domain, 'products', undefined, query)
  }
}

export default new ProductService()
