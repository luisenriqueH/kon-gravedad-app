import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Button as PaperButton } from 'react-native-paper'
import { useAuth } from '../contexts/AuthProvider'
import { useData } from '../contexts/DataProvider'

export default function UserHeader({ navigation, navigate, personLock }: any) {
  const { user, loading } = useAuth()
  const go = navigation && navigation.navigate ? (s: string) => navigation.navigate(s) : navigate

  const { person } = useData()

  
  
  if (loading) return null


  if (!user) {
    return (
        <View style={styles.container}>
        <Text style={styles.message}>No estás autenticado.</Text>
        <PaperButton onPress={() => go && go('Ajustes')}>Ir a Ajustes</PaperButton>
      </View>
    )
  }
  
  if (personLock && !(person.length > 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Faltan datos por agregar.</Text>
        <PaperButton onPress={() => go && go('RegisterPerson')}>Ir a Ajustes</PaperButton>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Usuario: {user.email ?? user.id}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    marginBottom: 6,
  },
})
