# Auditoría de Fase 1 — 2026-10-25

## Capacidades verificadas

- Next.js 16, React 19, TypeScript estricto y PostgreSQL mediante `pg`.
- Acceso privado por cookie HTTP-only firmada; las rutas administrativas y de biblioteca validan la sesión en servidor.
- OpenAI se invoca únicamente desde rutas de servidor para texto e imagen.
- Biblioteca de video en Vercel Blob y PostgreSQL, con carga autenticada, límites de tipo/tamaño y deduplicación por huella del cliente.
- OAuth de TikTok implementado para Login Kit: estado anti-CSRF en cookie, intercambio de código en servidor y tokens cifrados con AES-256-GCM.

## Estado real de TikTok

La conexión actual solicita solamente `user.info.basic`; no puede publicar ni enviar borradores. No existe todavía una ruta de Direct Post, Upload, consulta de estado, webhook ni almacenamiento de publicaciones.

Para publicar directamente se necesitarán `video.publish`, aprobación de ese scope y la auditoría de TikTok. Antes de cada publicación se debe consultar `creator_info`, presentar las opciones de privacidad que TikTok devuelva y obtener el consentimiento explícito del creador. Los clientes sin auditar quedan restringidos a visibilidad privada.

Para enviar un borrador editable se requerirá `video.upload`; no equivale a publicar. TikTok notificará al creador para que complete la edición y publicación dentro de TikTok.

Referencias oficiales: [Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post), [Upload](https://developers.tiktok.com/docs/en/content-posting-api-reference-upload-video), [estado de publicación](https://developers.tiktok.com/docs/en/content-posting-api-reference-get-video-status), [requisitos de transferencia](https://developers.tiktok.com/docs/en/content-posting-api-media-transfer-guide).

## Brechas y decisiones

- No hay servicio de generación o composición de video configurado. Las imágenes y memes actuales son imágenes, no videos, y no se presentarán como tales. La Fase 2 debe añadir un proveedor de renderizado vertical 9:16, voz, subtítulos, música con licencia y transiciones, detrás de variables de entorno de servidor.
- La biblioteca guarda tipo y tamaño, pero todavía no duración, resolución, FPS ni códec. La prevalidación de TikTok debe incorporar inspección fiable del archivo antes de publicar.
- No hay cola, planificador persistente, bloqueo distribuido, auditoría de acciones ni esquema de métricas. Deben implementarse antes de activar automatización.
- TikTok no expone automáticamente todas las métricas solicitadas; la Fase 5 solo almacenará los campos autorizados por los scopes y endpoints aprobados.

## Primer incremento implementado

`creative_generations` guarda los resultados del Estudio IA cuando `DATABASE_URL` está configurada. Usa una huella SHA-256 del brief y parámetros normalizados para devolver una generación equivalente ya guardada y evitar duplicados/coste innecesario. Cuando no hay base de datos, se mantiene la generación actual pero la interfaz informa que no se pudo conservar el historial.

La solicitud de guion exige ahora gancho, desarrollo, sorpresa o remate, CTA y duración sugerida, sin afirmar que se produjo un video final.

## Configuración pendiente

Además de las variables sociales existentes, el ejemplo de entorno documenta `CLYVORA_PANEL_PASSWORD`, `CLYVORA_SESSION_SECRET`, `BLOB_READ_WRITE_TOKEN` y `MEDIA_MAX_UPLOAD_BYTES`. No se añadieron secretos al repositorio.
