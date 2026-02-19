
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Button, ActivityIndicator, Dialog, Portal, TextInput, Text, List, Snackbar } from 'react-native-paper';
import AssetsPackageService, { PackageMeta } from '../../services/AssetsPackageService';
import ScreenProvider from '../../contexts/ScreenProvider';

const API_BASE = 'https://koningo.com/api/trazada';
function getPackageUrl(trackId: string) {
  return `${API_BASE}/track/tracks/${trackId}/`;
}


export default function PackageManager() {
  const [tracks, setTracks] = useState<any[]>([]); // Lista de pistas
  const [packages, setPackages] = useState<PackageMeta[]>([]); // Paquetes instalados
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [installDialog, setInstallDialog] = useState<{ open: boolean, track?: any }>({ open: false });
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean, trackId?: string, name?: string }>({ open: false });
  const [snackbar, setSnackbar] = useState<{ visible: boolean, message: string }>({ visible: false, message: '' });

  // Cargar pistas y paquetes
  const fetchAll = async () => {
    setRefreshing(true);
    try {
      // Puedes ajustar el dominio según tu app
      const pkgs = await AssetsPackageService.listPackages();
      setPackages(pkgs);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message || 'Error al cargar datos' });
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Determina si una pista está instalada
  const isInstalled = (trackId: string) => packages.some(pkg => pkg.trackId === trackId);
  const getPackage = (trackId: string) => packages.find(pkg => pkg.trackId === trackId);

  // Instalar paquete
  const handleInstall = async (track: any) => {
    setLoading(true);
    try {
      const url = getPackageUrl(track.id || track.trackId);
      await AssetsPackageService.downloadAndInstall(track.id || track.trackId, track.name, url);
      await fetchAll();
      setSnackbar({ visible: true, message: 'Paquete instalado correctamente' });
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message || 'No se pudo instalar el paquete' });
    }
    setLoading(false);
    setInstallDialog({ open: false });
  };

  // Eliminar paquete
  const handleRemove = async (trackId: string) => {
    setLoading(true);
    try {
      await AssetsPackageService.removePackage(trackId);
      await fetchAll();
      setSnackbar({ visible: true, message: 'Paquete eliminado' });
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message || 'No se pudo eliminar el paquete' });
    }
    setLoading(false);
    setRemoveDialog({ open: false });
  };

  // Reparar paquete
  const handleRepair = async (pkg: PackageMeta) => {
    setLoading(true);
    try {
      const url = getPackageUrl(pkg.trackId);
      await AssetsPackageService.repairPackage(pkg.trackId, pkg.name, url, pkg.version);
      await fetchAll();
      setSnackbar({ visible: true, message: 'Paquete reparado' });
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message || 'No se pudo reparar el paquete' });
    }
    setLoading(false);
  };

  // Renderiza cada pista con su estado de paquete
  const renderTrack = ({ item }: { item: any }) => {
    const pkg = getPackage(item.id || item.trackId);

    return (
      <List.Item
        title={`${item.nombre} (ID: ${item.id || item.trackId})`}
        description={() => (
          <>
            {pkg ? (
              <>
                <Text>Versión: {pkg.version || 'N/A'} | Estado: {pkg.status}</Text>
                <Text>Archivos: {pkg.files.length} | Tamaño: {pkg.size ? (pkg.size / 1024).toFixed(1) + ' KB' : 'N/A'}</Text>
                {pkg.status === 'corrupt' && <Text style={{ color: 'red' }}>Corrupto: {pkg.error}</Text>}
              </>
            ) : (
              <Text style={{ color: '#888' }}>No instalado</Text>
            )}
          </>
        )}
        right={() => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {pkg ? (
              pkg.status === 'corrupt' ? (
                <Button mode="outlined" onPress={() => handleRepair(pkg)} style={styles.btn}>Reparar</Button>
              ) : (
                <Button mode="contained" buttonColor="#d00" onPress={() => setRemoveDialog({ open: true, trackId: pkg.trackId, name: item.name })} style={styles.btn}>Eliminar</Button>
              )
            ) : (
              <Button mode="contained" onPress={() => setInstallDialog({ open: true, track: item })} style={styles.btn}>Instalar</Button>
            )}
          </View>
        )}
        style={styles.item}
      />
    );
  };

  return (
    <ScreenProvider title="Gestión de Paquetes" authLock={true} backButton={true}>
      <Text style={styles.header}>Gestión de Paquetes de Pistas</Text>
      {loading && <ActivityIndicator animating={true} style={{ margin: 16 }} />}
      <Button mode="contained" onPress={fetchAll} style={{ marginVertical: 8 }}>Actualizar lista</Button>
      <FlatList
        data={tracks}
        keyExtractor={item => String(item.id || item.trackId)}
        renderItem={renderTrack}
        refreshing={refreshing}
        onRefresh={fetchAll}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={<Text style={{ margin: 24, textAlign: 'center' }}>No hay pistas disponibles.</Text>}
      />

      {/* Dialogo de instalación */}
      <Portal>
        <Dialog visible={installDialog.open} onDismiss={() => setInstallDialog({ open: false })}>
          <Dialog.Title>Instalar paquete</Dialog.Title>
          <Dialog.Content>
            <Text>¿Instalar paquete para la pista "{installDialog.track?.name}"?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInstallDialog({ open: false })}>Cancelar</Button>
            <Button onPress={() => installDialog.track && handleInstall(installDialog.track)}>Instalar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialogo de eliminación */}
      <Portal>
        <Dialog visible={removeDialog.open} onDismiss={() => setRemoveDialog({ open: false })}>
          <Dialog.Title>Eliminar paquete</Dialog.Title>
          <Dialog.Content>
            <Text>¿Seguro que deseas eliminar el paquete de "{removeDialog.name}"?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRemoveDialog({ open: false })}>Cancelar</Button>
            <Button onPress={() => removeDialog.trackId && handleRemove(removeDialog.trackId)}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </ScreenProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  item: { backgroundColor: '#f6f6f6', borderRadius: 8, marginVertical: 4 },
  btn: { marginRight: 8 },
});
