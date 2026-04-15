# 📖 Manual de Build Local (Android)

Este documento detalla los pasos para generar un archivo `.aab` (Android App Bundle) para la tienda, utilizando tu propia máquina en lugar de la nube de Expo.

## Requisitos Previos
1. **Java Development Kit (JDK)**: Versión 17 o 21 (Temurin recomendado).
2. **Android SDK**: Instalado y configurado en la variable de entorno `ANDROID_HOME`.
3. **Keystore**: Archivo para firmar la aplicación (ver sección "Firmado").

## Pasos para el Despliegue

### 1. Limpieza y Sincronización
Antes de compilar, asegúrate de que el código nativo esté sincronizado con el de JavaScript:
```powershell
npx expo prebuild --clean
```

### 2. Limpieza de Gradle
Elimina archivos temporales de builds anteriores:
```powershell
cd android
./gradlew clean
```

### 3. Generación del Bundle (.aab)
Este comando compilará la aplicación en modo producción:
```powershell
./gradlew bundleRelease
```
El archivo resultante se encontrará en:
`android/app/build/outputs/bundle/release/app-release.aab`

## Gestión de la Keystore (Firma)
Para subir a la tienda, la app debe estar firmada.

### 1. Organización Segura
Toda la información sensible vive en la carpeta `/credentials` (protegida por `.gitignore`):
1. Mueve tu archivo `koningo-release-key.jks` a `/credentials/`.
2. Mueve tu certificado `upload_certificate.pem` a `/credentials/`.

### 2. Configuración de Secretos
Edita `android/gradle.properties` (¡No lo subas a Git!) con los valores de tu nueva llave:
```properties
MYAPP_RELEASE_STORE_FILE=koningo-release-key.jks
MYAPP_RELEASE_KEY_ALIAS=koningo-upload-key
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```
*(El Config Plugin se encargará de buscar el archivo dentro de `/credentials` automáticamente).*

## Solución de Problemas Comunes
- Si el build falla por memoria: Aumenta `org.gradle.jvmargs` en `gradle.properties`.
- Si el build falla por "Duplicate Class": Ejecuta `./gradlew clean` y verifica dependencias duplicadas en `package.json`.
