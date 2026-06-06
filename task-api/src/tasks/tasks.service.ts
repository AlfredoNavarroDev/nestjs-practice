import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Task, TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  getAll(): Task[] {
    return this.tasks;
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
