import { ApiProperty } from '@nestjs/swagger';

export interface IOrganizationModel {
  id: number;
  alternateName?: string;
  contactPoint?: any[];
  description?: string;
  email?: string;
  memberOf?: any[];
  members?: any[];
  name?: string;
  owner?: any;
  subOrganization?: any[];
  telephone?: string;
}

export class Organization {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ required: false, description: 'Referencia a kon_node_auth.id' })
  owner?: number;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  alternateName?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  telephone?: string;

  @ApiProperty({ required: false, type: [Object], description: 'Puntos de contacto (tel, dirección, etc.)' })
  contactPoint?: any[];

  @ApiProperty({ required: false, type: [Object], description: 'Organizaciones a las que pertenece' })
  memberOf?: any[];

  @ApiProperty({ required: false, type: [Object], description: 'Miembros de la organización' })
  members?: any[];

  @ApiProperty({ required: false, description: 'Propietario/administrador principal' })
  owner?: any;

  @ApiProperty({ required: false, type: [Object], description: 'Sub-organizaciones' })
  subOrganization?: any[];

  @ApiProperty({ type: String, format: 'date-time' })
  fecha_creacion!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  fecha_actualizacion!: Date;

  @ApiProperty()
  eliminado!: boolean;
}
