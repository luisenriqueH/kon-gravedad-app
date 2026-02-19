import { ApiProperty } from '@nestjs/swagger';
export class DynamicDetails {}


export class Place {
    @ApiProperty({ example: 1 })  id!: number;
    @ApiProperty({ required: false }) address?: any;
    @ApiProperty({ required: false }) containedIn?: string;
    @ApiProperty({ required: false }) containsPlace?: string;
    @ApiProperty({ required: false }) description?: string;
    @ApiProperty({ required: false }) image?: string;
    @ApiProperty({ required: false }) latitude?: string;
    @ApiProperty({ required: false }) longitude?: string;
    @ApiProperty({ required: false }) maximumAttendeeCapacity?: string;
    @ApiProperty({ required: false }) name?: string;
    @ApiProperty({ required: false }) openingHours?: string;
    @ApiProperty({ required: false }) owner?: string;
    @ApiProperty({ required: false }) publicAccess?: boolean;
    @ApiProperty({ required: false }) serviceArea?: string;
    @ApiProperty({ required: false }) telephone?: string;
}	
