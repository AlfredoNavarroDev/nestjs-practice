# NestJS Learning Path — Básico a Intermedio

Ruta práctica de aprendizaje. Cada nivel tiene conceptos, proyecto de práctica y checklist de competencias.

---

## Roadmap

```
Nivel 1 ──── Módulos, Controladores, Servicios, DTOs básicos
    │
Nivel 2 ──── TypeORM, Entidades, Repositorios, Migraciones
    │
Nivel 3 ──── Validación avanzada, Swagger, Response DTOs
    │
Nivel 4 ──── Autenticación JWT, Guards, Passport, RBAC
    │
Nivel 5 ──── Unit Tests, E2E Tests, Cobertura
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
| **DataSource** | Configuración de conexión a la base de datos. |
| **Soft Delete** | Marcar registro como eliminado sin borrarlo físicamente (`deletedAt`). |
| **Migraciones** | Scripts versionados para cambios de esquema. Nunca `synchronize: true` en prod. |

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
- [ ] Configurar `TypeOrmModule.forRoot()` con variables de entorno
- [ ] Usar `repository.find()`, `findOne()`, `save()`, `softDelete()`
- [ ] Lanzar `NotFoundException` cuando `findOne` retorna `null`
- [ ] Implementar paginación con `findAndCount()`
- [ ] Generar y ejecutar migraciones
- [ ] Nunca usar `synchronize: true` fuera de desarrollo local

---

## Nivel 3 — Validación y Documentación

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

## Nivel 4 — Autenticación JWT

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

## Nivel 5 — Tests

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

# Nivel 3 — Swagger
npm install @nestjs/swagger swagger-ui-express

# Nivel 4 — Auth JWT
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
