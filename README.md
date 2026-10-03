# Clyvora

Clyvora es una plataforma de inteligencia social para creadores y marcas. Su propósito es transformar ideas en contenido, centralizar la operación de perfiles y aprender de métricas reales; no crea cuentas ni seguidores falsos.

## Lo que incluye esta versión

- Panel profesional y adaptable a móvil.
- Estudio de IA funcional: toma un brief y crea gancho, guion, copys y adaptaciones por red.
- Flujo de contenido como borrador y controles de aprobación humana.
- Centro de automatizaciones responsables: revisión, análisis posterior y recomendaciones semanales.
- Estado de conexión para TikTok, Instagram y Facebook, preparado para OAuth oficial.
- Endpoint de salud y endpoint de generación server-side.

## Ejecutar localmente

```powershell
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Activar la IA

Instala las dependencias y copia `.env.example` como `.env.local`. Añade tu clave en `OPENAI_API_KEY`; la clave solo se lee en el servidor y nunca debe exponerse en el navegador ni subirse a Git.

```powershell
Copy-Item .env.example .env.local
```

Después reinicia `npm run dev`. El Estudio IA usa la API Responses para texto y la Image API para imágenes mediante el SDK oficial de OpenAI. Puedes seleccionar los modelos permitidos configurando `OPENAI_MODEL` y `OPENAI_IMAGE_MODEL`.

Las tarjetas de TikTok, Instagram y Facebook no marcan una conexión hasta completar OAuth real. Para activarlas hacen falta las credenciales de desarrollador, URLs públicas de retorno y la aprobación de permisos de cada plataforma.

## Siguiente arquitectura de producción

1. Autenticación de usuarios y equipos (por ejemplo, Auth.js).
2. PostgreSQL + Prisma para cuentas, contenidos, métricas, aprobaciones y auditoría.
3. Gestor seguro de secretos y cifrado de tokens OAuth en reposo.
4. Cola de trabajos para publicaciones programadas y sincronización de métricas.
5. Conectores separados para Meta e TikTok, siempre usando las APIs y scopes oficiales.
6. Revisión de permisos, políticas de privacidad, términos del servicio y auditorías requeridas por cada plataforma.

## Integraciones oficiales

- Meta: Instagram Graph API y Facebook Pages API. Requiere una app de Meta, cuentas autorizadas y permisos aprobados según la función.
- TikTok: Content Posting API. La publicación pública directa requiere el scope `video.publish` y la auditoría de la aplicación; sin auditoría, TikTok restringe ese contenido a visibilidad privada.

Nunca se debe automatizar el seguimiento de cuentas, crear perfiles artificiales, capturar contraseñas ni eludir límites de ninguna plataforma.
