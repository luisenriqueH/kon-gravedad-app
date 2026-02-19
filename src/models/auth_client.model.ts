import { ApiProperty } from '@nestjs/swagger';

export class AuthClient {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'user' })
  rol!: string;

  @ApiProperty({ example: 'user@example.com', description: 'Correo electrónico' })
  correo!: string;

  @ApiProperty({ required: false, description: 'Indica si el correo fue verificado' })
  correo_verificado?: boolean;

  @ApiProperty({ required: false, description: 'Clave (hashed). No exponer en respuestas públicas' })
  clave?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  fecha_creacion!: Date;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  fecha_ultima_conexion?: Date | null;
}
