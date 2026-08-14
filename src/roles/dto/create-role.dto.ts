import { ApiProperty } from '@nestjs/swagger'; import { ArrayUnique,IsArray,IsString,Matches } from 'class-validator';
export class CreateRoleDto { @ApiProperty() @IsString() @Matches(/^[A-Z][A-Z0-9_]*$/) code!:string; @ApiProperty() @IsString() name!:string; @ApiProperty({type:[String]}) @IsArray() @ArrayUnique() @IsString({each:true}) permissionCodes!:string[]; }
