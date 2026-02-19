import React, { createContext, useContext, useEffect, useState } from 'react'
import authService, { User } from '../services/api/AuthService'
import { Portal, Dialog, Button as PaperButton, Paragraph } from 'react-native-paper'

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [pendingRestoreUser, setPendingRestoreUser] = useState<User | null>(null)

  
  useEffect(() => {
    // Al arrancar, intenta restaurar sesión desde almacenamiento local
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const restored = await authService.tryRestoreSession()

        if (mounted && restored) {
          // Si la sesión es reciente (<6h), se restaura automáticamente
          if (restored.status === 'auto') {
            setUser(restored.user)
          } 
          // Si es más antigua pero válida, se pregunta al usuario
          else if (restored.status === 'prompt') {
            setPendingRestoreUser(restored.user)
            setShowRestoreDialog(true)
          }
        } else if (mounted) {
          const u = authService.getUser()
          setUser(u)
        }
      } catch (e) {
        if (mounted) setUser(authService.getUser())
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const u = await authService.signIn(email, password)
      setUser(u)
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string) => {
    setLoading(true)
    try {
      const u = await authService.createClient(email, password)
      setUser(u)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.signOut()
    setUser(null)
  }

  const refresh = () => {
    const u = authService.getUser()
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}

      <Portal>
        <Dialog visible={showRestoreDialog} onDismiss={() => setShowRestoreDialog(false)}>
          <Dialog.Title>Sesión guardada</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Se encontró una sesión guardada. ¿Quieres continuar con la sesión guardada o iniciar sesión con otra cuenta?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={async () => {
              // continuar con la sesión guardada
              setShowRestoreDialog(false)
              if (pendingRestoreUser) setUser(pendingRestoreUser)
              setPendingRestoreUser(null)
            }}>Continuar</PaperButton>
            <PaperButton onPress={async () => {
              // descartar sesión guardada y forzar login
              setShowRestoreDialog(false)
              setPendingRestoreUser(null)
              try { authService.signOut() } catch {}
              setUser(null)
            }}>Iniciar sesión</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AuthContext.Provider>
  )
}

export default AuthContext