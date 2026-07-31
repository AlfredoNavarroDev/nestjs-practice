import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Task, TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';

@Injectable()
export class TasksService {
  // Almacenamiento en memoria (sin DB): se pierde al reiniciar la app.
  // Es el punto clave de Nivel 1, en Nivel 2 esto se reemplaza por un Repository.
  private tasks: Task[] = [];

  getAll(filter: GetTaskFilterDto): Task[] {
    const { status } = filter;
    let tasks = this.tasks;
    if (status) {
      // Filtro opcional por query param (?status=...), ver GetTaskFilterDto.
      tasks = tasks.filter((task) => task.status === status);
    }
    return tasks;
  }

  getById(id: string): Task {
    const task = this.tasks.find((task) => task.id === id);
    if (!task) throw new NotFoundException(`No se encontro la tarea ${id}`);
    return task;
  }

  create(dto: CreateTaskDto): Task {
    const task: Task = {
      id: uuid(),
      title: dto.title,
      description: dto.description,
      // Toda tarea nace en estado PENDING; el cliente no puede definirlo al crear.
      status: TaskStatus.PENDING,
    };
    this.tasks.push(task);
    return task;
  }

  updateStatus(id: string, status: UpdateTaskDto): Task {
    const task = this.getById(id);
    task.status = status.status;
    return task;
  }

  delete(id: string): void {
    this.getById(id);
    this.tasks = this.tasks.filter((task) => task.id !== id);
  }
}
