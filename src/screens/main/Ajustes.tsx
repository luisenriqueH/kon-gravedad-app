import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Button as PaperButton, List, Divider, Card, Title, Dialog, Portal, Paragraph, Snackbar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthProvider';
import ScreenProvider from '../../contexts/ScreenProvider';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

export default function Ajustes({ navigation }: any) {
  const { user, loading, logout } = useAuth();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingForUpdate, setCheckingForUpdate] = useState(true);

  const currentVersion = Application.nativeApplicationVersion || '0.0.0';

  useEffect(() => {
    if (!__DEV__) {
      const checkExpoUpdate = async () => {
        try {
          const update = await Updates.checkForUpdateAsync();
          setUpdateAvailable(update.isAvailable);
        } catch (e) {
          console.error('Error checking for updates', e);
        } finally {
          setCheckingForUpdate(false);
        }
      };
      checkExpoUpdate();
    }
  }, []);

  const handleUpdate = async () => {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e) {
      setSnackbar({ visible: true, message: 'No se pudo actualizar la aplicación.', error: true });
    }
  };

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', error: false });

  if (loading) {
    return (
      <ScreenProvider title="Ajustes">
        <ActivityIndicator size="large" />
      </ScreenProvider>
    );
  }

  return (
    <ScreenProvider title="Ajustes" bottomButtons={true}>
      <ScrollView contentContainerStyle={styles.container}>
        {user ? (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Title>Cuenta</Title>
                <List.Item
                  title="Perfil de Usuario"
                  description="Edita tu información pública"
                  left={props => <List.Icon {...props} icon="account-circle" />}
                  onPress={() => navigation.navigate('Profile')}
                />
                <Divider />
                <List.Item
                  title="Información Personal"
                  description="Gestiona tus datos privados"
                  left={props => <List.Icon {...props} icon="account-edit" />}
                  onPress={() => navigation.navigate('PersonalInfo')}
                />
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Title>Aplicación</Title>
                <List.Item
                  title="Gestión de Paquetes"
                  description="Administra los módulos de la app"
                  left={props => <List.Icon {...props} icon="package-variant" />}
                  onPress={() => navigation.navigate('PackageManager')}
                />
                {updateAvailable && (
                  <>
                  <Divider />
                  <List.Item
                    title="Actualización Disponible"
                    description="Hay una nueva versión de la app lista para instalar"
                    left={props => <List.Icon {...props} icon="update" color="#4CAF50" />}
                    onPress={handleUpdate}
                  />
                  </>
                )}
              </Card.Content>
            </Card>

            <PaperButton
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon="logout"
            >
              Cerrar Sesión
            </PaperButton>

            <Portal>
              <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
                <Dialog.Title>Cerrar Sesión</Dialog.Title>
                <Dialog.Content>
                  <Paragraph>¿Estás seguro de que quieres cerrar sesión?</Paragraph>
                </Dialog.Content>
                <Dialog.Actions>
                  <PaperButton onPress={() => setLogoutDialogVisible(false)}>Cancelar</PaperButton>
                  <PaperButton onPress={() => { setLogoutDialogVisible(false); logout(); }}>
                    Sí, cerrar sesión
                  </PaperButton>
                </Dialog.Actions>
              </Dialog>
            </Portal>

            <Text style={styles.version}>Versión: {currentVersion}</Text>
          </>
        ) : (
          <View style={styles.loggedOutContainer}>
            <Text style={styles.loggedOutText}>Inicia sesión para gestionar tu cuenta.</Text>
            <PaperButton mode="contained" onPress={() => navigation.navigate('Login')} style={{marginBottom: 10}}>
              Iniciar sesión
            </PaperButton>
            <PaperButton mode="outlined" onPress={() => navigation.navigate('Register')}>
              Registrarse
            </PaperButton>
          </View>
        )}
      </ScrollView>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{ backgroundColor: snackbar.error ? '#c62828' : '#4CAF50' }}
      >
        {snackbar.message}
      </Snackbar>
    </ScreenProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 16,
    borderColor: '#F44336',
  },
  version: {
    marginTop: 24,
    textAlign: 'center',
    color: '#666',
  },
  loggedOutContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loggedOutText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  }
});