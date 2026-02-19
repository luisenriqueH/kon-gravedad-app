import { ApiProperty } from '@nestjs/swagger';


export interface IProductModel {  id: number;  brand: string;  category: string;  manufacturer: string;  model: string;  offers: string;  sku: string;  description: string;  image: string;  name: string; }


export class Product implements IProductModel {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ required: false })
  name!: string;

  @ApiProperty({ required: false })
  description!: string;

  @ApiProperty({ required: false })
  sku!: string;

  @ApiProperty({ required: false })
  offers!: string;

  @ApiProperty({ required: false, description: 'Tipo de producto, p.ej. Vehicle, Track' })
  type?: string;

  @ApiProperty({ required: false, description: 'Referencia a kon_node_auth.id' })
  owner?: number;

  @ApiProperty({ required: false })
  owner_type?: string;

  @ApiProperty({ required: false })
  brand!: string;

  @ApiProperty({ required: false })
  model!: string;

  @ApiProperty({ required: false })
  category!: string;

  @ApiProperty({ required: false })
  manufacturer!: string;

  @ApiProperty({ required: false })
  mpn?: string;

  @ApiProperty({ required: false })
  gtin?: string;

  @ApiProperty({ required: false })
  image!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  fecha_creacion!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  fecha_actualizacion!: Date;

  @ApiProperty()
  eliminado!: boolean;

  @ApiProperty({ required: false, type: 'object', description: 'Detalles específicos por tipo de producto' })
  details?: any;
}



export interface IPlaceModel {  id: number;  address: string;  geo: string;  description: string;  image: string;  name: string;  url: string; }
