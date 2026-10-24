import {
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  usuario: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}