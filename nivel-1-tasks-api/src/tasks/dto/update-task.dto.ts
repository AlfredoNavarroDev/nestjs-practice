import { IsEnum } from 'class-validator';
import { TaskStatus } from '../task.model';

export class UpdateTaskDto {
  @IsEnum(TaskStatus, {
    message:
      'Solo puede tener los estados de "pediente", "en progreso" y "completado"',
  })
  status: TaskStatus;
}
