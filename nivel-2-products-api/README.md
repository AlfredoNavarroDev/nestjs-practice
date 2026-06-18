# Nivel 2 — API REST de Productos (PostgreSQL + TypeORM)

CRUD de productos con persistencia real en PostgreSQL. Soft delete, paginación y variables de entorno validadas.

## Conceptos que practica

| Concepto | Descripción |
|----------|-------------|
| **Entidades** | Clases TypeScript que mapean a tablas DB con decoradores TypeORM. |
| **Repository** | Abstracción para operaciones DB por entidad. |
| **DataSource** | Objeto central de conexión y configuración de TypeORM. |
| **Soft Delete** | Marcar registro como eliminado sin borrarlo físicamente (`deletedAt`). |
| **Migraciones** | Scripts versionados para cambios de esquema. Nunca `synchronize: true` en prod. |
| **@nestjs/config + Joi** | Variables de entorno tipadas y validadas al arranque. |
| **Paginación** | `findAndCount()` para listar con `page` y `limit`. |

## Endpoints

```
GET    /products           → listar (?page=1&limit=10)
GET    /products/:id       → obtener por UUID
POST   /products           → crear
PATCH  /products/:id       → actualizar
DELETE /products/:id       → soft delete
```

---

## Prerequisitos

PostgreSQL corriendo. Con Docker:

```bash
docker run --name pg-dev \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=products_db \
  -p 5432:5432 \
  -d postgres:16
```

---

## Paso a paso

### 1. Crear el proyecto

```bash
nest new nivel-2-products-api
cd nivel-2-products-api
```

### 2. Instalar dependencias

```bash
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config joi
npm install class-validator class-transformer
```

### 3. Configurar variables de entorno

Crear `.env` en la raíz del proyecto:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASS=secret
DB_NAME=products_db
```

Agregar `.env` al `.gitignore`.

### 4. Esquema de validación de env

Crear `src/config/env.validation.ts`:

```typescript
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),
});
```

### 5. Configurar AppModule

`src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from './config/env.validation';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
      }),
    }),
    ProductsModule,
  ],
})
export class AppModule {}
```

### 6. DataSource para CLI de migraciones

Crear `src/data-source.ts`:

```typescript
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
```

### 7. Generar el módulo de productos

```bash
nest g module products
nest g controller products --no-spec
nest g service products --no-spec
```

### 8. Definir la entidad

Crear `src/products/entities/product.entity.ts`:

```typescript
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
```

### 9. Crear los DTOs

**`src/products/dto/create-product.dto.ts`**

```typescript
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;
}
```

**`src/products/dto/update-product.dto.ts`**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

**`src/products/dto/pagination-query.dto.ts`**

```typescript
import { IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit: number = 10;
}
```

### 10. Implementar el servicio

`src/products/products.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const [items, total] = await this.productsRepository.findAndCount({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.productsRepository.softDelete(id);
  }
}
```

### 11. Implementar el controlador

`src/products/products.controller.ts`:

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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
```

### 12. Registrar repositorio en el módulo

`src/products/products.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

### 13. Configurar ValidationPipe global

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
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### 14. Generar y ejecutar la migración

```bash
# Generar migración desde la entidad
npx typeorm migration:generate src/migrations/CreateProductsTable -d src/data-source.ts

# Revisar el archivo generado en src/migrations/
# Ejecutar la migración
npx typeorm migration:run -d src/data-source.ts
```

### 15. Levantar el servidor

```bash
npm run start:dev
```

---

## Probar la API

```bash
# Crear producto
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","description":"MacBook Pro 14","price":2499.99,"stock":10}'

# Listar con paginación
curl "http://localhost:3000/products?page=1&limit=5"

# Obtener por ID (reemplazar <uuid>)
curl http://localhost:3000/products/<uuid>

# Actualizar precio
curl -X PATCH http://localhost:3000/products/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"price":2299.99}'

# Soft delete (el registro no se borra de la DB, solo se marca deletedAt)
curl -X DELETE http://localhost:3000/products/<uuid>
```

---

## Comandos TypeORM útiles

```bash
# Ver estado de migraciones ejecutadas
npx typeorm migration:show -d src/data-source.ts

# Revertir la última migración
npx typeorm migration:revert -d src/data-source.ts
```

---

## Checklist

- [x] Definir entidad con UUID, `createdAt`, `updatedAt`, `deletedAt`
- [x] Configurar `TypeOrmModule.forRootAsync()` con `ConfigService`
- [x] Crear `src/data-source.ts` para CLI de migraciones
- [x] Usar `repository.findOne()`, `save()`, `softDelete()`
- [x] Lanzar `NotFoundException` cuando `findOne` retorna `null`
- [x] Implementar paginación con `findAndCount()`
- [x] Generar y ejecutar migración con TypeORM CLI
- [x] `synchronize: false` siempre
- [x] Variables de entorno validadas con Joi
