import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString({ message: 'El campoo de "titulo" debe ser texto' })
  @IsNotEmpty({ message: 'Este campo no debe quedar vacio' })
  @MaxLength(100, { message: 'El contenido debe ser mayor a uno' })
  title: string;

  @IsString({ message: 'El campoo de "descripcion" debe ser texto' })
  @IsNotEmpty({ message: 'No puede quedar vacio' })
  description: string;
}
