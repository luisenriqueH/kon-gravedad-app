# Brand assets (ubicación `assets/brand/`)

Coloca aquí las imágenes fuente que usarás para el icono y la splash:

- `assets/brand/icon.png` o `assets/brand/icon.svg` — icono cuadrado de alta resolución (recomendado 1024×1024)
- `assets/brand/splash.png` o `assets/brand/splash.svg` — imagen para splash (opcional; puede ser la misma que el icono o una versión más grande; recomendado 2732×2732 o al menos 2048×2048)

Uso

1. Añade tus imágenes a `assets/brand/icon.png` y `assets/brand/splash.png`.
2. Ejecuta `npm run generate:brand` para crear variantes en `assets/brand/output/`.
3. Revisa las carpetas dentro de `assets/brand/output/`.
   - Si existe `android/app/src/main/res/`, el script intentará copiar automáticamente los `mipmap-*` y `drawable-*` generados a esa carpeta.
    - Si existe `android/app/src/main/res/`, el script intentará copiar automáticamente los `mipmap-*` y `drawable-*` generados a esa carpeta. Además generará:
       - `mipmap-anydpi-v26/ic_launcher.xml` y `ic_launcher_round.xml` (adaptive icon) que usan `@color/iconBackground` como fondo y `@mipmap/ic_launcher` como foreground.
       - `drawable/ic_launcher_background.xml` (forma sólida usando `@color/iconBackground`).
       - `drawable/launch_background.xml` que muestra `@drawable/splash` centrado sobre `@color/splashscreen_background`.

      Backups

      - Antes de sobrescribir `android/app/src/main/res/`, el script crea un backup completo `res_backup_YYYY-MM-DDTHH-MM-SS-...` en `android/app/src/main/`.
      - Si tu proyecto iOS existe, el script intentará localizar carpetas `*.xcassets` y hará backup antes de copiar `AppIcon.appiconset` y `LaunchImage.imageset`.
   - Para iOS (si existe `ios/`): copia manualmente `assets/brand/output/ios/AppIcon.appiconset` a `ios/YourApp/Images.xcassets/AppIcon.appiconset` y `assets/brand/output/ios/LaunchImage.imageset` a `ios/YourApp/Images.xcassets/LaunchImage.imageset`.

Notas

- El script requiere `sharp` (se instala como `devDependency`).
- El script copiará automáticamente recursos a Android si detecta la ruta `android/app/src/main/res/`. Haz commit sólo tras revisar los archivos copiados.
