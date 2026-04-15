# 🛠 Guía de Troubleshooting de Build - Android

## Error: `apply plugin: "com.facebook.react.rootproject"` (Línea 24)
Este error suele ocurrir en versiones recientes de React Native (0.81+) cuando el plugin de Gradle no puede resolverse correctamente.

### Posibles Causas y Soluciones:
1. **Incompatibilidad de NDS/SDK**: Asegúrate de que las versiones en `android/build.gradle` y `android/app/build.gradle` coincidan con lo que pide Expo.
2. **Caché Corrupto**:
   - Borrar `android/.gradle` y `android/app/build`.
   - Ejecutar `npx expo prebuild --clean`.
3. **Versión de Java**: Gradle 8.14 (usado en este proyecto) requiere Java 17 o superior.
   - Verifica con `java -version`.
4. **Dependencias de Node**:
   - Asegúrate de que `@react-native/gradle-plugin` esté instalado.
   - Prueba: `npm install @react-native/gradle-plugin --save-dev`.

## Errores de Memoria (Heap Space)
Si el build falla por falta de memoria RAM:
- Edita `android/gradle.properties`:
  ```properties
  org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
  ```

## Error de Duplicado de Clases
Si ves `Duplicate class...`:
- Ejecutar `./gradlew clean`.
- Verificar si hay librerías que incluyen el mismo SDK de forma conflictiva.
