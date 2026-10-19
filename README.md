# Tareas en Familia

App web para organizar la casa: tareas con revisión de los papás, pizarrón de trastes, deudas con abonos (bloques de Amazon), recados y anuncios.

- **Next.js 15** (App Router, Server Actions) + **Tailwind 4**
- **Supabase**: inicio de sesión, base de datos y permisos por rol (RLS)
- **Vercel**: publicación (plan gratis)

## Roles

| Rol | Puede |
|---|---|
| Papá / Mamá (`admin`) | Crear, editar y borrar todo; aprobar o regresar tareas, trastes y abonos |
| Hija (`hija`) | Mover sus tareas entre *Por hacer*, *En proceso* y *Para revisar*; anotar trastes (descuentos solo para ella); reportar abonos; pegar recados y marcarlos "Ya quedó" |

Los permisos viven en la base de datos (`supabase/migrations/0001_init.sql`), así que se respetan aunque alguien intente saltarse la app.

## Configuración

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta `supabase/migrations/0001_init.sql`.
3. Agrega los correos de la familia (solo esos podrán crear cuenta):

   ```sql
   insert into public.members (email, name, nickname, role, color) values
     ('papa@correo.com',    'Saulo',   null,   'admin', '#2563eb'),
     ('mama@correo.com',    'Mamá',    null,   'admin', '#0d9488'),
     ('renata@correo.com',  'Renata',  null,   'hija',  '#f97316'),
     ('rebeca@correo.com',  'Rebeca',  'Rebe', 'hija',  '#ec4899'),
     ('romina@correo.com',  'Romina',  'Romy', 'hija',  '#8b5cf6');
   ```

4. En **Authentication → Sign In / Providers → Email**, desactiva *Confirm email* (opcional, evita esperar el correo de confirmación). Si lo dejas activo, en **URL Configuration** pon la URL de Vercel como *Site URL*.
5. Copia `.env.example` a `.env.local` con el *Project URL* y la *publishable key* (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; también acepta `NEXT_PUBLIC_SUPABASE_ANON_KEY`) (en Vercel, ponlas como variables de entorno).
6. Cada quien entra a la app, toca **"¿Primera vez? Crea tu contraseña"** y listo.

## Desarrollo

```bash
npm install
npm run dev
```
