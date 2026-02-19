import React, { useState } from 'react'
import { View, TextInput, StyleSheet, ActivityIndicator, Text } from 'react-native'
import { Button as PaperButton, Snackbar } from 'react-native-paper'
import ScreenProvider from '../../contexts/ScreenProvider'
import authService from '../../services/api/AuthService'
import { useAuth } from '../../contexts/AuthProvider'

export default function DeleteAccount({ navigation }: any) {
  const { user, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')
  const [snackbarError, setSnackbarError] = useState(false)

  const handleDelete = async () => {
    if (!user) {
      setSnackbarMsg('No hay usuario activo')
      setSnackbarError(true)
      setSnackbarVisible(true)
      return
    }
    setLoading(true)
    try {
      await authService.deleteAccount(user.id, currentPassword)
      logout()
      setSnackbarMsg('Cuenta eliminada')
      setSnackbarError(false)
      setSnackbarVisible(true)
      navigation.navigate('Inicio')
    } catch (err: any) {
      setSnackbarMsg(err?.message || 'Error al cerrar cuenta')
      setSnackbarError(true)
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenProvider title="Cerrar cuenta" authLock={true} backButton={true}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <View style={styles.container}>
          <Text style={styles.subtitle}>Introduce tu clave para confirmar eliminación</Text>
          <TextInput
            placeholder="Clave actual"
            placeholderTextColor="#999"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            style={styles.input}
            secureTextEntry
          />
          <View style={styles.buttonWrap}>
            <PaperButton mode="contained" onPress={handleDelete}>Cerrar cuenta</PaperButton>
          </View>
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={{ label: 'Cerrar', onPress: () => setSnackbarVisible(false) }}
        style={snackbarError ? { backgroundColor: '#c62828' } : undefined}
      >
        {snackbarMsg}
      </Snackbar>
    </ScreenProvider>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 12 },
  input: {
    width: '100%',
    maxWidth: 300,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  buttonWrap: { marginVertical: 6 },
})
