import { ApiProperty } from '@nestjs/swagger';



export interface IEventModel {  id: number;  location: string;  organizer: string;  description: string;  image: string;  name: string;  url: string; }



export class Event {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  owner?: string;
  

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  startDate?: Date;

  @ApiProperty({ required: false })
  salesDurationHours?: number;
  
  @ApiProperty({ type: String, format: 'date-time', required: false })
  endDate?: Date;
  
  @ApiProperty({ required: false, type: [String], description: 'Lista de participantes (IDs o referencias)'} )
  participants?: string[];
  
  @ApiProperty({ required: false, type: [String], description: 'Etiquetas o categorías del evento' })
  tags?: string[];
  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  organizer?: string;

  @ApiProperty({ required: false })
  prizeAmount?: number;

  @ApiProperty({ required: false })
  eventStatus?: string;

  @ApiProperty({ type: 'object', required: false, description: 'Datos adicionales en JSON' })
  json_data?: any;

  @ApiProperty({ required: false, description: 'ID o referencia a la etapa actual del evento' })
  currentStageId?: string;
  
  @ApiProperty({ required: false, description: 'Oferta principal en JSON' })
  offer?: any;
  
  @ApiProperty({ required: false, isArray: true, type: 'object', description: 'Lista de ofertas en JSON' })
  offers?: any[];
  
  @ApiProperty({ required: false, isArray: true, type: 'object', description: 'Promociones aplicables' })
  promotions?: any[];
  
  @ApiProperty({ type: String, format: 'date-time', required: false })
  salesStartDate?: Date;
}
