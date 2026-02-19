import React, { useState } from 'react'
import { View, TextInput, StyleSheet, ActivityIndicator } from 'react-native'
import { Button as PaperButton, Snackbar } from 'react-native-paper'
import ScreenProvider from '../../contexts/ScreenProvider'
import { useAuth } from '../../contexts/AuthProvider'

export default function Login({ navigation }: any) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')
  const [snackbarError, setSnackbarError] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      await login(email, password)
      setSnackbarMsg('Inicio de sesión correcto')
      setSnackbarError(false)
      setSnackbarVisible(true)
      navigation.goBack()
    } catch (err: any) {
      setSnackbarMsg(err?.message || 'Error al iniciar sesión')
      setSnackbarError(true)
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenProvider title="Iniciar sesión" backButton={true}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <View style={styles.container}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
          <View style={styles.buttonWrap}>
            <PaperButton mode="contained" onPress={handleLogin}>Iniciar sesión</PaperButton>
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
  container: { padding: 16, alignItems: 'center', width: '100%' },
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
