import React, { useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Button as PaperButton, Snackbar } from 'react-native-paper'
import ScreenProvider from '../../contexts/ScreenProvider'
import { useAuth } from '../../contexts/AuthProvider'

export default function Profile({ navigation }: any) {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      setSnackbarMsg('Sesión cerrada')
      setSnackbarVisible(true)
      navigation.goBack()
    } catch (err: any) {
      setSnackbarMsg(err?.message || 'Error al cerrar sesión')
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenProvider title="Perfil" backButton={true}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <View style={styles.container}>
          <Text style={styles.label}>ID</Text>
          <Text style={styles.value}>{user?.id || '—'}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || '—'}</Text>
          <View style={styles.buttonWrap}>
            <PaperButton mode="contained" onPress={() => navigation.navigate('ChangePassword')}>Cambiar clave</PaperButton>
          </View>
          <View style={styles.buttonWrap}>
            <PaperButton mode="contained" onPress={() => navigation.navigate('ChangeEmail')}>Cambiar correo</PaperButton>
          </View>
          <View style={styles.buttonWrap}>
            <PaperButton mode="contained" onPress={() => navigation.navigate('DeleteAccount')}>Cerrar cuenta</PaperButton>
          </View>
          <View style={styles.buttonWrap}>
            <PaperButton mode="outlined" onPress={() => logout()}>Cerrar sesión</PaperButton>
          </View>
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={{ label: 'Cerrar', onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMsg}
      </Snackbar>
    </ScreenProvider>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'flex-start', width: '100%' },
  label: { color: '#666', marginTop: 8 },
  value: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
  buttonWrap: { marginTop: 12, alignSelf: 'stretch' },
})
