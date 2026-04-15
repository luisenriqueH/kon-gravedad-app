const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin para corregir errores de build y configurar firma en Android
 * - Forza el uso de SDK 35 y NDK 26.1 para estabilidad.
 * - Comenta la aplicación manual del plugin 'com.facebook.react.rootproject'.
 * - Configura el signingConfig de release para usar las llaves en /credentials.
 */
const withAndroidFixes = (config) => {
  // Aplicar cambios al build.gradle de la RAÍZ
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'gradle') {
      config.modResults.contents = fixProjectBuildGradle(config.modResults.contents);
    }
    return config;
  });

  // Aplicar cambios al build.gradle de la APP (para la firma)
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'gradle') {
      config.modResults.contents = fixAppBuildGradle(config.modResults.contents);
    }
    return config;
  });

  return config;
};

/**
 * Corrige el build.gradle de la raíz (SDK versions y plugin conflict)
 */
function fixProjectBuildGradle(content) {
  // 1. Inyectar bloque ext con versiones estables si no existe
  if (!content.includes('buildToolsVersion =')) {
    content = content.replace(
       /buildscript\s*\{/,
      `buildscript {
  ext {
    buildToolsVersion = "35.0.0"
    minSdkVersion = 24
    compileSdkVersion = 35
    targetSdkVersion = 35
    ndkVersion = "26.1.10909125"
    kotlinVersion = "2.1.20"
  }`
    );
  }

  // 2. Comentar la aplicación del plugin que falla
  const pluginPattern = /apply\s+plugin:\s+["']com\.facebook\.react\.rootproject["']/g;
  if (pluginPattern.test(content)) {
    content = content.replace(pluginPattern, (match) => {
       return match.startsWith('//') ? match : '// ' + match;
    });
  }

  return content;
}

/**
 * Corrige el build.gradle de la app (Configuración de firma)
 */
function fixAppBuildGradle(content) {
  // 1. Añadir el release signing config si no existe
  // Ajustamos para buscar el keystore en /credentials relativo a la raíz del proyecto
  if (content.includes('signingConfigs {') && !content.includes('release {')) {
    content = content.replace(
      'signingConfigs {',
      `signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                // Buscamos relativo a la raíz del proyecto (2 niveles arriba de android/app)
                storeFile file("../../credentials/" + MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }`
    );
  }

  // 2. Cambiar signingConfig de debug a release en el buildType release
  const releaseBuildTypePattern = /release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.debug/g;
  if (releaseBuildTypePattern.test(content)) {
    content = content.replace(
      releaseBuildTypePattern,
      (match) => match.replace('signingConfigs.debug', 'signingConfigs.release')
    );
  }

  return content;
}

module.exports = withAndroidFixes;
