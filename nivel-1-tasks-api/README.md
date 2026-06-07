# Nivel 1 — API REST de Tareas (sin base de datos)

CRUD completo de tareas con almacenamiento en memoria (array). Sin base de datos.

## Conceptos que practica

| Concepto | Descripción |
|----------|-------------|
| **Módulos** | Unidad organizacional. Cada feature tiene su propio módulo. |
| **Controladores** | Reciben requests HTTP, delegan al servicio. |
| **Servicios** | Lógica de negocio con `@Injectable()`. |
| **DTOs** | Definen la forma del request con `class-validator`. |
| **ValidationPipe** | Valida y transforma datos de entrada automáticamente. |
| **ParseUUIDPipe** | Valida que un param sea UUID válido antes de llegar al servicio. |
| **NotFoundException** | Excepción HTTP 404 integrada de NestJS. |

## Endpoints

```
GET    /tasks              → listar tareas (filtro: ?status=PENDING)
GET    /tasks/:id          → obtener por UUID
POST   /tasks              → crear tarea
PATCH  /tasks/:id/status   → actualizar status
DELETE /tasks/:id          → eliminar
```

---

## Paso a paso

### 1. Crear el proyecto

```bash
nest new nivel-1-tasks-api
cd nivel-1-tasks-api
```

### 2. Instalar dependencias

```bash
npm install class-validator class-transformer
npm install uuid
npm install -D @types/uuid
```

### 3. Generar el módulo de tareas

```bash
nest g module tasks
nest g controller tasks --no-spec
nest g service tasks --no-spec
```

### 4. Definir el modelo

Crear `src/tasks/task.model.ts`:

```typescript
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
}
```

### 5. Crear los DTOs

**`src/tasks/dto/create-task.dto.ts`**

```typescript
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
```

**`src/tasks/dto/update-task.dto.ts`**

```typescript
import { IsEnum } from 'class-validator';
import { TaskStatus } from '../task.model';

export class UpdateTaskDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
```

**`src/tasks/dto/get-tasks-filter.dto.ts`**

```typescript
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../task.model';

export class GetTaskFilterDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
```

### 6. Implementar el servicio

`src/tasks/tasks.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Task, TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  getAll(filter: GetTaskFilterDto): Task[] {
    const { status } = filter;
    if (status) return this.tasks.filter((t) => t.status === status);
    return this.tasks;
  }

  getById(id: string): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new NotFoundException(`Tarea ${id} no encontrada`);
    return task;
  }

  create(dto: CreateTaskDto): Task {
    const task: Task = { id: uuid(), ...dto, status: TaskStatus.PENDING };
    this.tasks.push(task);
    return task;
  }

  updateStatus(id: string, dto: UpdateTaskDto): Task {
    const task = this.getById(id);
    task.status = dto.status;
    return task;
  }

  delete(id: string): void {
    this.getById(id);
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }
}
```

### 7. Implementar el controlador

`src/tasks/tasks.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Query() filter: GetTaskFilterDto): Task[] {
    return this.tasksService.getAll(filter);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Task {
    return this.tasksService.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaskDto): Task {
    return this.tasksService.create(dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ): Task {
    return this.tasksService.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseUUIDPipe) id: string): void {
    this.tasksService.delete(id);
  }
}
```

### 8. Registrar el módulo

`src/tasks/tasks.module.ts` (verificar que incluya controller y service):

```typescript
import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
```

Importar en `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [TasksModule],
})
export class AppModule {}
```

### 9. Configurar ValidationPipe global

`src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(3000);
}
bootstrap();
```

### 10. Levantar el servidor

```bash
npm run start:dev
```

---

## Probar la API

```bash
# Crear tarea
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Aprender NestJS","description":"Completar nivel 1"}'

# Listar tareas
curl http://localhost:3000/tasks

# Filtrar por status
curl "http://localhost:3000/tasks?status=PENDING"

# Obtener por ID (reemplazar <uuid>)
curl http://localhost:3000/tasks/<uuid>

# Actualizar status
curl -X PATCH http://localhost:3000/tasks/<uuid>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'

# Eliminar
curl -X DELETE http://localhost:3000/tasks/<uuid>
```

---

## Checklist

- [x] Crear proyecto con `nest new`
- [x] Generar módulo, controlador y servicio con `nest g`
- [x] Usar `@Body()`, `@Param()`, `@Query()` correctamente
- [x] Crear DTOs con `class-validator`
- [x] Registrar `ValidationPipe` global en `main.ts`
- [x] Lanzar `NotFoundException` cuando tarea no existe
- [x] Entender flujo: Request → Controller → Service → Response
