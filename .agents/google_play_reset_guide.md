# 🔐 Guía de Reset de Llave de Firma en Google Play

Si has perdido tu llave original o necesitas cambiarla por un error de fingerprint, sigue estos pasos para solicitar un reset a Google.

## Paso 0: Preparación
Ya has generado los archivos necesarios en la raíz de tu proyecto:
1. **`koningo-release-key.jks`**: Tu nueva llave de producción (guardada en `/credentials`).
2. **`upload_certificate.pem`**: El certificado público que Google necesita para el reset (guardado en `/credentials`).

## Paso 1: Acciones en Google Play Console
1. Inicia sesión en [Google Play Console](https://play.google.com/console/).
2. Selecciona tu aplicación (`Gravedad`).
3. En el menú de la izquierda, navega hasta **Versión** > **Integridad de la aplicación**.
4. Busca la pestaña **Firma de aplicaciones**.
5. Haz clic en el botón **Solicitar cambio en la clave de firma**.
   > [!NOTE] 
   > Si no ves el botón inmediatamente, busca la opción que dice "Si has perdido tu clave de firma de aplicaciones..." o similar.
6. Selecciona el motivo: "He perdido mi clave de firma" o "Tengo problemas con el fingerprint".
7. Cuando te pida el certificado, sube el archivo **`upload_certificate.pem`** que generamos.

## Paso 2: El Periodo de Espera
- Una vez solicitado, recibirás un correo de confirmación de Google.
- **Tiempo estimado**: De **24 a 72 horas**.
- Durante este tiempo, no podrás subir ninguna versión nueva.

## Paso 3: Finalización del Reset
- Google te enviará un segundo correo confirmando que la nueva llave ha sido registrada.
- El correo te dará una **fecha y hora específica** a partir de la cual podrás subir el nuevo `.aab`.
- **IMPORTANTE**: No intentes subir el archivo antes de esa fecha exacta, ya que volverá a dar error de firma.

## Paso 4: Próximo Despliegue
Una vez que llegue la fecha confirmada por Google:
1. Asegúrate de que `versionCode` sea mayor al anterior (usaremos el `2` que ya configuramos).
2. Ejecuta `npx expo prebuild --clean`.
3. Ejecuta `./gradlew bundleRelease`.
4. Sube el `.aab` resultante.

---
> [!CAUTION]
> **No borres nunca** la carpeta `/credentials`. Sin el archivo `.jks`, tendrás que repetir este proceso de reset cada vez.
