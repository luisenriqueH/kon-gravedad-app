import React, { use, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Snackbar } from 'react-native-paper'
import ScreenProvider from '../../contexts/ScreenProvider';
import PersonService from '../../services/api/PersonService';
import { useData } from '../../contexts/DataProvider';
import { useAuth } from '../../contexts/AuthProvider';

export default function RegisterPerson({ navigation }: any) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')
  const [snackbarError, setSnackbarError] = useState(false)
  

  const {user} = useAuth();
  const {person,refresh} = useData();

  useEffect(()=>{
    if (person.length>0) {
      setName(person[0].name || '')
      setEmail(person[0].email)
      setPhone(person[0].telephone)
    }
  },[person]);


  const submit = async () => {
    if (!name.trim()) {
      setSnackbarMsg('Nombre es requerido')
      setSnackbarError(true)
      setSnackbarVisible(true)
      return
    }
    setLoading(true)
    try {
      const body: any = { name: name }
      if (email) body.email = email
      if (phone) body.telephone = phone
      console.log('Submitting person with body:', body,person);
      if (person.length>0) {
        var result = await PersonService.updatePerson(person[0].id, body)
        refresh();
        console.log('update result:', result)
      } else {
        console.log('Creating new person');
        await PersonService.createPerson({
          owner: user?.id,
          ...body,
        })
      }
      setSnackbarMsg('Persona registrada correctamente')
      setSnackbarError(false)
      setSnackbarVisible(true)
      navigation.goBack && navigation.goBack()
    } catch (e) {
      setSnackbarMsg('No se pudo registrar la persona')
      setSnackbarError(true)
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenProvider title="Registrar persona" authLock={true} backButton={true} bottomButtons={true}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Teléfono" keyboardType="phone-pad" />

          <TouchableOpacity style={styles.button} onPress={submit} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  container: { width: '100%', padding: 16, alignItems: 'center' },
  label: { alignSelf: 'flex-start', fontSize: 14, fontWeight: '700', marginTop: 8 },
  card: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8 },
  input: { width: '100%', padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginTop: 6 },
  button: { marginTop: 16, backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' }
})
