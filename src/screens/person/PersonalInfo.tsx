import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import ScreenProvider from '../../contexts/ScreenProvider'
import { Button as PaperButton, Snackbar } from 'react-native-paper'
import { useData } from '../../contexts/DataProvider'


export default function PersonalInfo({ route, navigation }: any) {
  
  const {person} = useData()
  const personOK = person[0] || null;


  console.log('Rendering PersonalInfo with person:', person);

  return (
    <ScreenProvider title="Información personal" backButton={true}>
      <ScrollView contentContainerStyle={styles.container}>
        

        {(personOK) && (<View>
              
              <Text style={styles.label}>Nombre completo</Text>
              <Text style={styles.value}>{person[0].fullName}</Text>

              <Text style={styles.label}>Correo electrónico</Text>
              <Text style={styles.value}>{person[0].email}</Text>

              <Text style={styles.label}>Número de teléfono</Text>
              <Text style={styles.value}>{person[0].phoneNumber}</Text>

              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.value}>{person[0].address}</Text>

              <Text style={styles.label}>Fecha de nacimiento</Text>
              <Text style={styles.value}>{person[0].birthDate}</Text>
                
        </View>)}

        {personOK ? (
            <>
              <View style={styles.buttonWrap}>
                <PaperButton mode="outlined" onPress={() => navigation.navigate('RegisterPerson')}>Editar</PaperButton>
              </View>
            </>
        ) : (
            <>
              <View style={styles.buttonWrap}>
                <PaperButton mode="outlined" onPress={() => navigation.navigate('RegisterPerson')}>Completar Registro Personal</PaperButton>
              </View>
            </>
        )}
      </ScrollView>
    </ScreenProvider>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'flex-start', width: '100%' },
  label: { color: '#666', marginTop: 12 },
  value: { fontSize: 16, fontWeight: '500', marginTop: 4 },
  buttonWrap: { marginTop: 12, alignSelf: 'stretch' },
})
