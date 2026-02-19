import { ApiProperty } from '@nestjs/swagger';

export class PayAction {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ required: false })
  identifier?: string;

  @ApiProperty({ type: 'object', required: false, description: 'Método de pago en JSON' })
  method?: any;

  @ApiProperty({ type: 'object', required: false, description: 'Evento asociado (objeto o referencia)' })
  subjectOf?: { '@type'?: string; id: string } | string;

  @ApiProperty({ required: false })
  actionStatus?: string;

  @ApiProperty({ type: 'object', required: false, description: 'Agente que realiza el pago (objeto con tipo, id y nombre)'} )
  agent?: { '@type': 'Person' | 'Organization'; id: string; name?: string } | string;

  @ApiProperty({ type: 'object', required: false, description: 'Receptor/beneficiario del pago' })
  recipient?: { '@type'?: string; identifier?: string; id?: string } | string;

  @ApiProperty({ required: false, isArray: true, type: 'object', description: 'Objetos relacionados en JSON' })
  object?: any[];

  @ApiProperty({ required: false, description: 'Precio expresado como número o string' })
  price?: number | string;

  @ApiProperty({ required: false })
  priceCurrency?: string;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  startTime?: Date;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false, description: 'Mensaje de error o estado' })
  error?: string | undefined;

  @ApiProperty({ type: String, format: 'date-time' })
  fecha_creacion!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  fecha_actualizacion!: Date;

  @ApiProperty()
  eliminado!: boolean;
}
