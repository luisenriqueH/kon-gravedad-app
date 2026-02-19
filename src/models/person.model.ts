import { ApiProperty } from '@nestjs/swagger';

export interface IPersonModel {  id: number;  email: string;  nationality: string;  sponsor: string;  telephone: string;  image: string;  name: string; }

export class Person {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ required: false, description: 'Referencia a kon_node_auth.id' })
  owner?: number;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  description?: string;
  
  @ApiProperty({ required: false })
  performerIn?: string[];

  @ApiProperty({ required: false })
  telephone?: string;

  @ApiProperty({ required: false, type: [String], description: 'Identificadores (tokens, dispositivos, etc.)' })
  identifier?: string[];

  @ApiProperty({ required: false, description: 'Rol del usuario' })
  role?: string;

  @ApiProperty({ required: false, type: [Object], description: 'Items de inventario propiedad del usuario' })
  owns?: any[];

  @ApiProperty({ required: false, type: [Object], description: 'Transacciones asociadas' })
  transactions?: any[];

  @ApiProperty({ required: false, description: 'Lenguaje preferido' })
  language?: string;

  @ApiProperty({ required: false, type: [Object], description: 'Métodos de pago asociados' })
  paymentMethods?: any[];

  @ApiProperty({ type: String, format: 'date-time' })
  fecha_creacion!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  fecha_actualizacion!: Date;

  @ApiProperty()
  eliminado!: boolean;
}
