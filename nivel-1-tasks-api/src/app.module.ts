import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [AppController],
  // TasksModule va en `imports`, no en `providers` (un módulo no es un provider).
  providers: [AppService],
})
export class AppModule {}
