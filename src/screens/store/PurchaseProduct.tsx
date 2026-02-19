import React, { useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native'
import ScreenProvider from '../../contexts/ScreenProvider'
import { useRoute, useNavigation } from '@react-navigation/native'
import AuthService, { AuthService as AuthClass } from '../../services/api/AuthService'
import { useAuth } from '../../contexts/AuthProvider'
import { Portal, Dialog, Paragraph, Button as PaperButton } from 'react-native-paper'
import { useData } from '../../contexts/DataProvider'
import { ProductService } from '../../services'

export default function PurchaseProduct() {
  const route: any = useRoute()
  const navigation: any = useNavigation()
  const product = route.params?.product;
  const { user } = useAuth()
  const { person, refresh } = useData()
  const [loading, setLoading] = useState(false)

  console.log('person',person);

  if (!product) {
    return (
      <ScreenProvider title="Compra" backButton={true}>
        <Text>No hay producto seleccionado.</Text>
      </ScreenProvider>
    )
  }

  const [success, setSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any | null>(null)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [dialogTitle, setDialogTitle] = useState<string | undefined>(undefined)
  const [dialogMessage, setDialogMessage] = useState<string | undefined>(undefined)
  const [dialogAction, setDialogAction] = useState<'login' | 'ok' | null>(null)

  const showDialog = (title?: string, message?: string, action: 'login' | 'ok' = 'ok') => {
    setDialogTitle(title)
    setDialogMessage(message)
    setDialogAction(action)
    setDialogVisible(true)
  }

  const handlePurchase = async () => {
    console.log('Attempting purchase for product:', product, person)
    if (!user) {
      showDialog('Atención', 'Debe iniciar sesión para comprar', 'login')
      return
    }
    if (person.length === 0) {
      showDialog('Atención', 'Debe completar el registro para comprar', 'login')
      return
    }
    setLoading(true)
    try {
      const today = new Date()
      const fecha = today.toISOString().split('T')[0]

      console.log('Purchasing product with data:', {
        productId: product.id || product.ID,
        personId: person[0].id || person[0].ID,
        date: fecha
      });

      refresh();

      setSuccess(true)
    } catch (err: any) {
      showDialog('Error', err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  const offers = JSON.parse(product.offers);

  return (
    <ScreenProvider title="Compra de producto" authLock={true} backButton>
      <View style={styles.container}>
        <Text style={styles.title}>{product.nombre ?? product.name ?? product.modelo ?? product.model}</Text>
        <Text style={styles.sub}>{product.descripcion ?? product.desc ?? ''}</Text>
        {product.image && <Image source={{ uri: product.image }} style={styles.vehicleImage} />}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Precio:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={styles.fieldValue}>{'k'}</Text>
            <Text style={styles.fieldValue}>{offers[0].price}</Text>
          </View>
        </View>
        <View style={{ height: 12 }} />
        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={{ fontWeight: '700', marginTop: 6 }}>Compra realizada</Text>
            <Text>El producto se ha añadido a tu garaje.</Text>
            <View style={{ height: 8 }} />
            <PaperButton mode="contained" onPress={() => navigation.navigate('Main', { screen: 'Garage' })}>
              Ir a mi Garage
            </PaperButton>
            <View style={{ height: 8 }} />
            <PaperButton onPress={() => navigation.goBack()}>Volver</PaperButton>
          </View>
        ) : (
          <PaperButton mode="contained" loading={loading} onPress={handlePurchase} disabled={loading}>
            {loading ? 'Comprando...' : 'Comprar'}
          </PaperButton>
        )}
      </View>
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          {dialogTitle ? <Dialog.Title>{dialogTitle}</Dialog.Title> : null}
          <Dialog.Content>
            <Paragraph>{dialogMessage}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            {dialogAction === 'login' ? (
              <>
                <PaperButton
                  onPress={() => {
                    setDialogVisible(false)
                    navigation.navigate('Login')
                  }}
                >
                  Iniciar sesión
                </PaperButton>
                <PaperButton onPress={() => setDialogVisible(false)}>Cancelar</PaperButton>
              </>
            ) : (
              <PaperButton onPress={() => setDialogVisible(false)}>OK</PaperButton>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenProvider>
  )
}

  

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  sub: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    width: '100%'
  },
  fieldLabel: {
    fontWeight: '600'
  },
  fieldValue: {
    color: '#333'
  },
  successBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#cfc',
    backgroundColor: '#f7fff7',
    alignItems: 'center'
  }
  ,
  vehicleImage: {
    width: 200,
    height: 150,
    resizeMode: 'contain',
    marginTop: 16,
  },
  successIcon: {
    fontSize: 48,
    lineHeight: 48,
    textAlign: 'center'
  }
  ,
  responseText: {
    fontFamily: undefined,
    fontSize: 12,
    color: '#222',
    marginTop: 6,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
  }
})
