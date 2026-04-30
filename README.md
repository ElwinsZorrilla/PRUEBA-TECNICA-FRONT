# Library Proxy - Frontend

Aplicación web hecha en Angular 19 para gestionar libros y autores. Se conecta a un backend que actúa como proxy de la API externa FakeRestAPI.

## Qué hace la aplicación

Permite ver, crear, editar y eliminar libros y autores. La interfaz tiene búsqueda en tiempo real, paginación con cursor, formularios en modales, métricas resumen y notificaciones de feedback.

## Tecnologías

- Angular 19 con componentes standalone
- Angular Material 19
- TypeScript
- RxJS
- Signals para estado reactivo

## Estructura del proyecto

El código está dividido en tres áreas: `core`, `shared` y `features`.

```
src/app/
├── core/
│   ├── models/          Interfaces de Book y Author
│   ├── services/        Servicio de notificaciones
│   └── interceptors/    Manejo global de loading y errores HTTP
│
├── shared/
│   └── components/
│       ├── layout/              Sidenav y toolbar
│       ├── confirm-dialog/      Modal de confirmación reutilizable
│       └── loading-spinner/     Spinner global
│
└── features/
    ├── books/
    │   ├── components/
    │   │   ├── book-list/       Listado con búsqueda y paginación
    │   │   ├── book-detail/     Detalle de un libro
    │   │   └── book-form/       Formulario en modal
    │   ├── interfaces/          Tipos específicos del feature
    │   └── services/            BookService
    │
    └── authors/
        ├── components/
        │   ├── author-list/
        │   └── author-form/
        ├── interfaces/
        └── services/
```

Cada feature se carga con lazy loading, así que solo se descarga lo que el usuario va a usar.

## Cómo levantar el proyecto

Necesitas Node.js 18 o superior y el backend corriendo en `http://localhost:5000`.

Clona el repo:

```bash
git clone https://github.com/ElwinsZorrilla/PRUEBA-TECNICA-FRONT.git
cd PRUEBA-TECNICA-FRONT
```

Instala dependencias:

```bash
npm install
```

Levanta el servidor de desarrollo:

```bash
npm start
```

La aplicación queda disponible en `http://localhost:4200`.

## Configuración

La URL del backend se define en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000/api'
};
```

Si tu backend corre en otro puerto o servidor, cambia ese valor.

## Patrones que se usan

### Signals

El estado local de los componentes se maneja con signals en lugar de `BehaviorSubject`. Los datos derivados usan `computed`:

```typescript
protected readonly books = signal<Book[]>([]);

protected readonly filteredBooks = computed(() => {
  const term = this.searchValue().toLowerCase();
  return this.books().filter(b => b.title.includes(term));
});
```

### Interceptors

Hay dos interceptores aplicados a todas las peticiones HTTP:

- **loadingInterceptor**: cuenta peticiones activas con un contador. Cuando hay al menos una en curso, muestra el spinner global.
- **errorInterceptor**: captura errores HTTP (400, 404, 500, error de red) y los muestra como snackbars.

### Modales en lugar de rutas

Los formularios de crear y editar no son páginas separadas. Se abren como modales encima de la lista usando `MatDialog`. Esto evita perder el contexto y hace la navegación más fluida.

### Búsqueda

Cada listado tiene un input que filtra mientras escribes. La búsqueda mira todos los campos relevantes: título, descripción, fecha, número de páginas, nombre del autor, etc.

### Paginación con cursor

La API devuelve un `nextCursor` y `previousCursor` en lugar de offsets. El usuario puede elegir cuántos items ver por página (10, 20, 30 o 40).

## Compilación para producción

```bash
ng build
```

Los archivos optimizados quedan en `dist/library-proxy-front/`.

## Problemas comunes

**No se conecta al backend.** Verifica que esté corriendo en `http://localhost:5000` abriendo esa URL en el navegador. Deberías ver Swagger.

**Errores raros al iniciar.** Borra `node_modules` y reinstala:

```bash
rm -rf node_modules package-lock.json
npm install
```

**El puerto 4200 está ocupado.** Cambia el puerto al iniciar:

```bash
ng serve --port 4300
```

**Errores de TypeScript en VS Code.** A veces el Angular Language Service necesita reiniciarse. Pulsa `Ctrl+Shift+P` y busca "Restart Angular Language Service".

## Repositorios

- Frontend: https://github.com/ElwinsZorrilla/PRUEBA-TECNICA-FRONT.git
- Backend: https://github.com/ElwinsZorrilla/PRUEBA-TECNICA-BACKEND.git
