import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// Use the legacy expo-file-system API to avoid refactoring to the new File/Directory classes
import * as FileSystem from 'expo-file-system/legacy';
// `react-native-zip-archive` is a native module; require it dynamically
// inside functions so the module does not run at load-time (avoids errors in Expo Go / metro).

export type PackageMeta = {
  trackId: string;
  name: string;
  version?: string | number | null;
  files: string[];
  size?: number; // bytes
  status: 'installed' | 'corrupt' | 'missing';
  error?: string | null;
};

const STORAGE_KEY = 'koningo:assets:packages';
const PACKAGES_DIR = `${FileSystem.documentDirectory}koningo_packages/`;

async function ensurePackagesDir() {
  if (Platform.OS !== 'web') {
    const info = await FileSystem.getInfoAsync(PACKAGES_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(PACKAGES_DIR, { intermediates: true });
    }
  }
}

async function loadMeta(): Promise<PackageMeta[]> {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as PackageMeta[];
    } else {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as PackageMeta[];
    }
  } catch (e) {
    return [];
  }
}

async function saveMeta(list: PackageMeta[]) {
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } else {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

function pkgDir(trackId: string) {
  return `${PACKAGES_DIR}${trackId}/`;
}

function zipPath(trackId: string) {
  return `${PACKAGES_DIR}${trackId}.zip`;
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  if (Platform.OS === 'web') {
    // On web, we store the zip as a single file
    return ['package.zip'];
  }
  try {
    const items = await FileSystem.readDirectoryAsync(dir);
    let results: string[] = [];
    for (const it of items) {
      const full = `${dir}${it}`;
      const info = await FileSystem.getInfoAsync(full);
      if (info.isDirectory) {
        const child = await listFilesRecursive(`${full}/`);
        results = results.concat(child.map(p => `${it}/${p}`));
      } else {
        results.push(it);
      }
    }
    return results;
  } catch (e) {
    return [];
  }
}

const AssetsPackageService = {
  async listPackages(): Promise<PackageMeta[]> {
    await ensurePackagesDir();
    const meta = await loadMeta();

    if (Platform.OS === 'web') {
      // On web, assume packages are installed if in meta
      return meta;
    }

    // Validate that package dirs exist and update status
    const updated = await Promise.all(
      meta.map(async (m) => {
        const dirInfo = await FileSystem.getInfoAsync(pkgDir(m.trackId));
        if (!dirInfo.exists) {
          return { ...m, status: 'missing' as const };
        }
        return m;
      })
    );

    await saveMeta(updated);
    return updated;
  },

  async downloadAndInstall(trackId: string, name: string, url: string, version?: string | number) {
    await ensurePackagesDir();

    if (Platform.OS === 'web') {
      // On web, download and store as base64 in localStorage
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      localStorage.setItem(`package_zip:${trackId}`, base64);

      const size = arrayBuffer.byteLength;
      const files = ['package.zip'];

      const metaList = await loadMeta();
      const existingIndex = metaList.findIndex(m => m.trackId === trackId);
      const newMeta: PackageMeta = {
        trackId,
        name,
        version: version ?? null,
        files,
        size,
        status: 'installed',
        error: null,
      };

      if (existingIndex >= 0) metaList[existingIndex] = newMeta;
      else metaList.push(newMeta);

      await saveMeta(metaList);
      return newMeta;
    }

    const zipDest = zipPath(trackId);
    const destDir = pkgDir(trackId);
    try {
      // remove any previous data
      const prev = await FileSystem.getInfoAsync(zipDest);
      if (prev.exists) await FileSystem.deleteAsync(zipDest, { idempotent: true });

      const prevDir = await FileSystem.getInfoAsync(destDir);
      if (prevDir.exists) await FileSystem.deleteAsync(destDir, { idempotent: true });

      // download
      const downloadRes = await FileSystem.createDownloadResumable(url, zipDest).downloadAsync();
      if (!downloadRes || (downloadRes.status !== 200 && downloadRes.status !== 201)) {
        throw new Error(`Download failed with status ${downloadRes?.status ?? 'unknown'}`);
      }

      // unzip using react-native-zip-archive (dynamic require)
      try {
        // ensure target directory exists
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
        let unzipFn: any;
        try {
          unzipFn = require('react-native-zip-archive')?.unzip;
        } catch (err) {
          throw new Error('Native unzip module not available: react-native-zip-archive. Run on un dispositivo real o instala el módulo nativo.');
        }
        if (typeof unzipFn !== 'function') {
          throw new Error('react-native-zip-archive.unzip no está disponible');
        }
        await unzipFn(zipDest, destDir);
      } catch (e: any) {
        // cleanup
        try { await FileSystem.deleteAsync(zipDest, { idempotent: true }); } catch (er) {}
        try { await FileSystem.deleteAsync(destDir, { idempotent: true }); } catch (er) {}
        throw new Error('Error al descomprimir el paquete: ' + (e?.message || String(e)));
      }

      // gather files and size
      const files = await listFilesRecursive(destDir);
      let size = 0;
      for (const f of files) {
        try {
          const info = await FileSystem.getInfoAsync(destDir + f);
          size += info.size || 0;
        } catch (e) {}
      }

      const metaList = await loadMeta();
      const existingIndex = metaList.findIndex(m => m.trackId === trackId);
      const newMeta: PackageMeta = {
        trackId,
        name,
        version: version ?? null,
        files,
        size,
        status: 'installed',
        error: null,
      };

      if (existingIndex >= 0) metaList[existingIndex] = newMeta;
      else metaList.push(newMeta);

      await saveMeta(metaList);

      // remove zip to save space
      try { await FileSystem.deleteAsync(zipDest, { idempotent: true }); } catch (e) {}

      return newMeta;
    } catch (e: any) {
      // Guardar el error en el meta para mostrarlo en pantalla
      const metaList = await loadMeta();
      const existingIndex = metaList.findIndex(m => m.trackId === trackId);
      const errorMsg = e?.message || 'Error desconocido al instalar el paquete';
      if (existingIndex >= 0) {
        metaList[existingIndex].status = 'corrupt';
        metaList[existingIndex].error = errorMsg;
        await saveMeta(metaList);
      } else {
        metaList.push({
          trackId,
          name,
          version: version ?? null,
          files: [],
          size: 0,
          status: 'corrupt',
          error: errorMsg,
        });
        await saveMeta(metaList);
      }
      throw new Error(errorMsg);
    }
  },

  async removePackage(trackId: string) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(`package_zip:${trackId}`);
    } else {
      const zipDest = zipPath(trackId);
      const destDir = pkgDir(trackId);
      try {
        await FileSystem.deleteAsync(zipDest, { idempotent: true });
        await FileSystem.deleteAsync(destDir, { idempotent: true });
      } catch (e) {}
    }

    const meta = await loadMeta();
    const filtered = meta.filter(m => m.trackId !== trackId);
    await saveMeta(filtered);
    return true;
  },

  async repairPackage(trackId: string, name: string, url: string, version?: string | number) {
    // identical to downloadAndInstall but tagged for repair
    try {
      // remove existing then re-download
      await this.removePackage(trackId);
      return await this.downloadAndInstall(trackId, name, url, version);
    } catch (e: any) {
      // mark as corrupt in metadata
      const meta = await loadMeta();
      const idx = meta.findIndex(m => m.trackId === trackId);
      if (idx >= 0) {
        meta[idx].status = 'corrupt';
        meta[idx].error = e.message || String(e);
        await saveMeta(meta);
      }
      throw e;
    }
  },
};

export default AssetsPackageService;
