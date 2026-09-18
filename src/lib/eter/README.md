# Éter — Almacenamiento & Assets

Dominio exclusivo de Éter. Gestión de imágenes de proyectos, capturas, PDFs (CV descargable), y cualquier asset subido.

- Validación de tipo MIME y tamaño antes de servir/subir.
- Helpers para `next/image` con proveedores externos (Cloudinary/S3) si el hosting de imágenes crece más allá de `public/`.
- Generación de URLs firmadas si se añade subida de assets desde un panel admin.

Mientras los assets sean estáticos en `public/`, esta carpeta documenta la convención de nombres y optimización (WebP/AVIF, dimensiones máximas).
