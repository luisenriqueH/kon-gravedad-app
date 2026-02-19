import React, { useState } from 'react'
import { View, TextInput, StyleSheet, ActivityIndicator, Text } from 'react-native'
import { Button as PaperButton, Snackbar } from 'react-native-paper'
import ScreenProvider from '../../contexts/ScreenProvider'
import authService from '../../services/api/AuthService'
import { useAuth } from '../../contexts/AuthProvider'

export default function ChangePassword({ navigation }: any) {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')
  const [snackbarError, setSnackbarError] = useState(false)

  const handleChange = async () => {
    if (!user) {
      setSnackbarMsg('No hay usuario activo')
      setSnackbarError(true)
      setSnackbarVisible(true)
      return
    }
    setLoading(true)
    try {
      await authService.changePassword(user.id, currentPassword, newPassword)
      setSnackbarMsg('Contraseña actualizada')
      setSnackbarError(false)
      setSnackbarVisible(true)
      navigation.goBack()
    } catch (err: any) {
      setSnackbarMsg(err?.message || 'Error al cambiar contraseña')
      setSnackbarError(true)
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenProvider title="Cambiar clave" authLock={true} backButton={true}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <View style={styles.container}>
          <Text style={styles.subtitle}>Introduce tu clave actual y la nueva</Text>
          <TextInput
            placeholder="Clave actual"
            placeholderTextColor="#999"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            style={styles.input}
            secureTextEntry
          />
          <TextInput
            placeholder="Nueva clave"
            placeholderTextColor="#999"
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
            secureTextEntry
          />
          <View style={styles.buttonWrap}>
            <PaperButton mode="contained" onPress={handleChange}>Cambiar clave</PaperButton>
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
