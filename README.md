# NestJS Learning Path — Básico a Intermedio

Ruta práctica de aprendizaje. Cada nivel tiene conceptos, proyecto de práctica y checklist de competencias.

---

## Roadmap

```
Nivel 1 ──── Módulos, Controladores, Servicios, DTOs básicos
    │
Nivel 2 ──── TypeORM, Entidades, Repositorios, Migraciones
    │
Nivel 3 ──── Relaciones, Índices, QueryBuilder, Transacciones
    │
Nivel 4 ──── Validación avanzada, Swagger, Response DTOs
    │
Nivel 5 ──── Autenticación JWT, Guards, Passport, RBAC
    │
Nivel 6 ──── Unit Tests, E2E Tests, Cobertura
```

---

## Nivel 1 — Fundamentos

### Conceptos

| Concepto | Descripción |
|----------|-------------|
| **Módulos** | Unidad organizacional. Todo feature vive en su propio módulo. |
| **Controladores** | Reciben requests HTTP, delegan lógica al servicio. |
| **Servicios** | Contienen lógica de negocio. `@Injectable()`. |
| **Inyección de dependencias** | NestJS maneja el ciclo de vida de instancias automáticamente. |
| **Decoradores HTTP** | `@Get`, `@Post`, `@Patch`, `@Delete`, `@Body`, `@Param`, `@Query`. |
| **Pipes** | Transforman y validan datos de entrada (`ValidationPipe`, `ParseUUIDPipe`). |
| **DTOs** | Objetos que definen la forma del request/response. |

### Proyecto de práctica

**API REST de Tareas (sin base de datos)**

Implementar CRUD completo de tareas usando un array en memoria como almacenamiento.

```
GET    /tasks          → listar todas las tareas (filtro opcional por status)
GET    /tasks/:id      → obtener tarea por ID
POST   /tasks          → crear tarea
PATCH  /tasks/:id      → actualizar tarea
DELETE /tasks/:id      → eliminar tarea
```

Modelo sugerido: `{ id, title, description, status: 'pending' | 'in-progress' | 'done' }`

### Checklist

- [x] Crear proyecto con `nest new`
- [x] Generar módulo, controlador y servicio con `nest g`
- [x] Usar `@Body()`, `@Param()`, `@Query()` correctamente
- [x] Crear DTOs con `class-validator`
- [x] Registrar `ValidationPipe` global en `main.ts`
- [x] Lanzar `NotFoundException` cuando tarea no existe
- [x] Entender flujo: Request → Controller → Service → Response

---

## Nivel 2 — Persistencia con TypeORM

### Conceptos

| Concepto | Descripción |
|----------|-------------|
| **Entidades** | Clases que mapean a tablas DB con decoradores TypeORM. |
| **Repository** | Abstracción para operaciones DB por entidad. |
| **DataSource** | Objeto central de configuración y conexión a la base de datos. |
| **Soft Delete** | Marcar registro como eliminado sin borrarlo físicamente (`deletedAt`). |
| **Migraciones** | Scripts versionados para cambios de esquema. Nunca `synchronize: true` en prod. |
| **Variables de entorno** | `@nestjs/config` + Joi para validar configuración de DB al arranque. |
| **UUID** | Identificador único universal. Preferido sobre auto-increment en APIs REST. |
| **Columnas especiales** | `@CreateDateColumn`, `@UpdateDateColumn`, `@DeleteDateColumn` — TypeORM las gestiona automáticamente. |

### Proyecto de práctica

**API REST de Productos con PostgreSQL**

```
GET    /products           → listar (con paginación: ?page=1&limit=10)
GET    /products/:id       → obtener por ID
POST   /products           → crear
PATCH  /products/:id       → actualizar
DELETE /products/:id       → soft delete
GET    /products/deleted   → listar productos eliminados
```

Modelo sugerido: `{ id (uuid), name, description, price, stock, createdAt, updatedAt, deletedAt }`

### Checklist

- [ ] Definir entidad con UUID, `createdAt`, `updatedAt`, `deletedAt`
- [ ] Configurar `TypeOrmModule.forRoot()` con variables de entorno via `ConfigService`
- [ ] Crear `src/data-source.ts` para CLI de migraciones
- [ ] Usar `repository.find()`, `findOne()`, `save()`, `softDelete()`
- [ ] Lanzar `NotFoundException` cuando `findOne` retorna `null`
- [ ] Implementar paginación con `findAndCount()`
- [ ] Generar y ejecutar migraciones con TypeORM CLI
- [ ] Nunca usar `synchronize: true` fuera de desarrollo local
- [ ] Variables de entorno validadas con Joi en `app.module.ts`

---

## Nivel 3 — Relaciones, Índices y Consultas Avanzadas

### Conceptos

| Concepto | Descripción |
|----------|-------------|
| **OneToMany / ManyToOne** | Relación padre-hijo. Ej: una categoría tiene muchos productos. |
| **ManyToMany** | Relación N:N. TypeORM crea tabla pivot automáticamente con `@JoinTable`. |
| **OneToOne** | Relación 1:1. Ej: un usuario tiene un perfil. Requiere `@JoinColumn`. |
| **Eager loading** | Cargar relación automáticamente en cada query con `eager: true`. Cuidado: siempre carga aunque no se necesite. |
| **Lazy loading** | Cargar relación explícitamente via `relations: ['entity']` o `QueryBuilder`. |
| **@Index** | Mejora rendimiento en columnas usadas en filtros o búsquedas frecuentes. |
| **QueryBuilder** | API fluida para consultas complejas con JOINs, condiciones dinámicas y subqueries. |
| **Transacciones** | Operaciones atómicas con `QueryRunner`: si una falla, todo revierte. |
| **Seeds** | Scripts para poblar la DB con datos iniciales de desarrollo o testing. |
| **Cascade** | Propagar operaciones (insert, update, delete) automáticamente a entidades relacionadas. |

### Proyecto de práctica

**API REST de E-commerce (Categorías + Productos + Tags)**

```
GET    /categories             → listar categorías con conteo de productos
GET    /categories/:id         → categoría con sus productos
POST   /categories             → crear categoría
DELETE /categories/:id         → eliminar (solo si no tiene productos activos)

GET    /products               → listar con filtros: ?categoryId=x&tag=y&minPrice=z
GET    /products/:id           → producto con categoría y tags
POST   /products               → crear con categoryId y tags[]
PATCH  /products/:id           → actualizar
DELETE /products/:id           → soft delete
```

Modelo sugerido:
- `Category: { id, name, slug, products: Product[] }`
- `Product: { id, name, sku, price, stock, category: Category, tags: Tag[], createdAt, updatedAt, deletedAt }`
- `Tag: { id, name, products: Product[] }`

Relaciones:
- `Category` → `Product`: OneToMany / ManyToOne
- `Product` ↔ `Tag`: ManyToMany con tabla pivot `product_tags`

### Checklist

- [ ] OneToMany en `Category`, ManyToOne en `Product` (con FK `category_id`)
- [ ] ManyToMany entre `Product` y `Tag` con `@JoinTable` en `Product`
- [ ] `@Index` en columnas de búsqueda frecuente: `sku`, `slug`, `price`
- [ ] QueryBuilder con `leftJoinAndSelect` para cargar relaciones con filtros opcionales
- [ ] Transacción con `QueryRunner`: crear producto y actualizar stock en una sola operación atómica
- [ ] Seed script ejecutable con `ts-node` que inserta categorías y productos de prueba
- [ ] Cascade configurado correctamente (no eliminar categoría con productos activos → `ConflictException`)
- [ ] Entender cuándo usar `eager: true` vs `relations: []` vs QueryBuilder
- [ ] Índice compuesto en casos necesarios (`@Index(['categoryId', 'price'])`)

---

## Nivel 4 — Validación y Documentación

### Conceptos

| Concepto | Descripción |
|----------|-------------|
| **class-validator** | Decoradores de validación en DTOs. |
| **class-transformer** | Transforma objetos planos a instancias de clase. `@Exclude()`, `@Type()`. |
| **Swagger / OpenAPI** | Documentación automática desde decoradores. |
| **Response DTOs** | Controlan qué campos se exponen al cliente. |
| **PartialType** | Genera DTO de actualización haciendo todos los campos opcionales. |

### Proyecto de práctica

**API REST de Artículos de Blog**

```
GET    /articles           → listar (filtros: ?author=x&tag=y&page=1)
GET    /articles/:id       → obtener por ID
POST   /articles           → crear
PATCH  /articles/:id       → actualizar
DELETE /articles/:id       → eliminar
```

Modelo sugerido: `{ id, title, content, author, tags: string[], status: 'draft' | 'published', publishedAt, createdAt, updatedAt }`

Requisitos:
- Swagger accesible en `/api/docs`
- `ArticleResponseDto` que excluya campos internos
- Validación: `title` entre 5-200 chars, `tags` máximo 10 elementos

### Checklist

- [ ] Setup Swagger en `main.ts`
- [ ] `@ApiProperty({ example, description })` en cada campo de DTO
- [ ] `@ApiTags`, `@ApiOperation`, `@ApiResponse` en controladores
- [ ] `UpdateDto` extiende `PartialType(CreateDto)`
- [ ] `ValidationPipe` con `whitelist: true` y `forbidNonWhitelisted: true`
- [ ] Response DTO excluye campos sensibles con `@Exclude()`
- [ ] `@ApiQuery` documenta query params opcionales

---

## Nivel 5 — Autenticación JWT

### Conceptos

| Concepto | Descripción |
|----------|-------------|
| **Guards** | Deciden si un request puede continuar. `@UseGuards()`. |
| **Passport** | Librería de estrategias de autenticación. |
| **JWT Strategy** | Valida token en header `Authorization: Bearer <token>`. |
| **bcrypt** | Hash de contraseñas. Nunca almacenar en texto plano. |
| **RBAC** | Control de acceso por roles con `@Roles()` + `RolesGuard`. |
| **@CurrentUser()** | Decorator custom para extraer usuario autenticado del request. |

### Proyecto de práctica

**API REST de Notas personales con Auth**

```
POST   /auth/register      → crear cuenta
POST   /auth/login         → obtener JWT

GET    /notes              → listar notas del usuario autenticado
GET    /notes/:id          → obtener nota (solo si es del usuario)
POST   /notes              → crear nota
PATCH  /notes/:id          → actualizar nota
DELETE /notes/:id          → eliminar nota

GET    /admin/users        → solo accesible con rol 'admin'
```

### Checklist

- [ ] `POST /auth/login` retorna JWT válido
- [ ] `JwtAuthGuard` rechaza requests sin token (401)
- [ ] `@CurrentUser()` decorator extrae payload del JWT
- [ ] Hash de contraseñas con `bcrypt`
- [ ] `JWT_SECRET` en variables de entorno, mínimo 32 chars
- [ ] Relación `User` → `Note`: usuario solo ve sus propias notas
- [ ] `RolesGuard` + `@Roles('admin')` en rutas protegidas
- [ ] Swagger configurado con `addBearerAuth()`

---

## Nivel 6 — Tests

### Conceptos

| Concepto | Descripción |
|----------|-------------|
| **Unit tests** | Prueban servicio aislado con repositorio mockeado. |
| **E2E tests** | Prueban flujo completo HTTP con DB real de test. |
| **TestingModule** | Módulo NestJS para entorno de testing. |
| **Mock Repository** | Reemplaza repositorio real con `jest.fn()` en unit tests. |
| **Cobertura** | Porcentaje de código ejecutado por los tests. Meta: ≥ 80%. |

### Proyecto de práctica

Agregar tests completos a cualquiera de los proyectos anteriores.

**Patrones de naming:**

```
// Unit
'findOne: id existe → retorna entidad'
'findOne: id no existe → lanza NotFoundException'
'create: datos válidos → guarda y retorna entidad'

// E2E
'GET /resources/:id: recurso existe → 200 + recurso'
'GET /resources/:id: recurso no existe → 404'
'POST /resources: body inválido → 400 + errores de validación'
```

### Checklist

- [ ] Unit tests con repositorio mockeado (nunca DB real)
- [ ] Cada método del servicio: happy path + branches de excepción
- [ ] `beforeEach` recrea `TestingModule` fresco
- [ ] `afterEach` llama `jest.clearAllMocks()`
- [ ] E2E tests usan DB de test separada (`NODE_ENV=test`)
- [ ] `afterEach` limpia tablas; `afterAll` cierra la app
- [ ] Cobertura ≥ 80% con `npm run test:cov`

---

## Comandos de referencia

### Proyecto

```bash
# Crear proyecto nuevo
nest new project-name

# Instalar CLI globalmente
npm install -g @nestjs/cli
```

### Generadores

```bash
# Recursos individuales
nest g module feature
nest g controller feature
nest g service feature

# CRUD completo de golpe (genera módulo + controller + service + DTOs + entity)
nest g resource feature

# Otros
nest g guard guards/jwt-auth
nest g decorator decorators/current-user
nest g filter filters/global-exception
nest g pipe pipes/parse-uuid
nest g interceptor interceptors/transform
```

### Dependencias por nivel

```bash
# Nivel 1 — Validación
npm install class-validator class-transformer

# Nivel 2 — TypeORM + PostgreSQL
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config joi    # variables de entorno

# Nivel 3 — No hay dependencias nuevas (usa las de Nivel 2)

# Nivel 4 — Swagger
npm install @nestjs/swagger swagger-ui-express

# Nivel 5 — Auth JWT
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

### TypeORM — Migraciones

```bash
# Generar migración desde cambios en entidades
npx typeorm migration:generate src/migrations/NombreDescriptivo -d src/data-source.ts

# Ejecutar migraciones pendientes
npx typeorm migration:run -d src/data-source.ts

# Revertir última migración
npx typeorm migration:revert -d src/data-source.ts

# Ver estado de migraciones
npx typeorm migration:show -d src/data-source.ts
```

### PostgreSQL — Utilidades

```bash
# Levantar PostgreSQL con Docker (desarrollo local)
docker run --name pg-dev \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  -d postgres:16

# Conectarse con psql
psql -h localhost -U admin -d mydb

# Comandos útiles dentro de psql
\dt              # listar tablas
\d nombre_tabla  # describir tabla (columnas, índices, FK)
\di              # listar índices
\x               # formato expandido (legible para filas anchas)

# Ver migraciones ejecutadas
SELECT * FROM migrations ORDER BY timestamp DESC;

# Ver índices de una tabla
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'products';
```

### Seeds

```bash
# Ejecutar seed script con ts-node
npx ts-node src/database/seeds/seed.ts

# Con script en package.json
npm run seed
```

### Tests

```bash
# Unit tests
npm run test

# Unit tests en modo watch
npm run test:watch

# E2E tests
npm run test:e2e

# Cobertura
npm run test:cov
```

### Dev

```bash
# Levantar en modo desarrollo (hot reload)
npm run start:dev

# Build producción
npm run build

# Levantar build de producción
npm run start:prod

# Lint
npm run lint
```

---

## Recursos

| Recurso | URL |
|---------|-----|
| Docs oficiales NestJS | https://docs.nestjs.com |
| TypeORM docs | https://typeorm.io |
| class-validator | https://github.com/typestack/class-validator |
| Swagger NestJS | https://docs.nestjs.com/openapi/introduction |
| JWT en NestJS | https://docs.nestjs.com/security/authentication |
