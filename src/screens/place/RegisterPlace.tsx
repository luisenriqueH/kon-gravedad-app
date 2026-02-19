import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { Button, Card, Snackbar, TextInput, Title, Switch } from 'react-native-paper';
import ScreenProvider from '../../contexts/ScreenProvider';
import { useAuth } from '../../contexts/AuthProvider';
import { Place } from '../../models/place.model';
import PlaceService from '../../services/api/PlaceService';

export default function RegisterPlace({ navigation, route }: any) {
  const { user } = useAuth();
  const existingPlace: Place = route?.params?.place || null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [telephone, setTelephone] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [maximumAttendeeCapacity, setMaximumAttendeeCapacity] = useState('');
  const [publicAccess, setPublicAccess] = useState<boolean>(false);
  const [serviceArea, setServiceArea] = useState('');
  const [containedIn, setContainedIn] = useState('');
  const [containsPlace, setContainsPlace] = useState('');

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', error: false });

  useEffect(() => {
    if (existingPlace) {
      setName(existingPlace.name || '');
      setDescription(existingPlace.description || '');
      setImage(existingPlace.image || '');
      setAddress(existingPlace.address || '');
      setLatitude(existingPlace.latitude || '');
      setLongitude(existingPlace.longitude || '');
      setTelephone(existingPlace.telephone || '');
      setOpeningHours(existingPlace.openingHours || '');
      setMaximumAttendeeCapacity(existingPlace.maximumAttendeeCapacity || '');
      const pa: any = existingPlace.publicAccess;
      setPublicAccess(pa === true || pa === 'true');
      setServiceArea(existingPlace.serviceArea || '');
      setContainedIn(existingPlace.containedIn || '');
      setContainsPlace(existingPlace.containsPlace || '');
    }
  }, [existingPlace]);

  const submit = async () => {
    if (!name.trim()) {
      setSnackbar({ visible: true, message: 'El nombre del lugar es requerido', error: true });
      return;
    }

    setLoading(true);
    try {
      const body: Partial<Place> = {
        name,
        description,
        image,
        address,
        latitude,
        longitude,
        telephone,
        openingHours,
        maximumAttendeeCapacity,
        publicAccess,
        serviceArea,
        containedIn,
        containsPlace,
      };

      if (user?.id) {
        body.owner = user.id.toString();
      }

      if (existingPlace?.id) {
        await PlaceService.updatePlace(existingPlace.id.toString(), body);
      } else {
        await PlaceService.createPlace(body as Place);
      }

      setSnackbar({ visible: true, message: 'Lugar guardado correctamente', error: false });
      setTimeout(() => navigation.goBack(), 1000);

    } catch (e: any) {
      const errorMessage = e.message || 'No se pudo guardar el lugar';
      setSnackbar({ visible: true, message: errorMessage, error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenProvider title={existingPlace ? "Editar Lugar" : "Registrar Lugar"} backButton={true}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{existingPlace ? "Edita los Detalles del Lugar" : "Crea un Nuevo Lugar"}</Title>
            <TextInput label="Nombre" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
            <TextInput label="Descripción" value={description} onChangeText={setDescription} style={[styles.input, { height: 100 }]} mode="outlined" multiline />
            <TextInput label="URL de la Imagen" value={image} onChangeText={setImage} placeholder="https://ejemplo.com/imagen.png" style={styles.input} mode="outlined" />
            <TextInput label="Dirección" value={address} onChangeText={setAddress} style={styles.input} mode="outlined" />
            <TextInput label="Latitud" value={latitude} onChangeText={setLatitude} style={styles.input} mode="outlined" keyboardType="numeric" />
            <TextInput label="Longitud" value={longitude} onChangeText={setLongitude} style={styles.input} mode="outlined" keyboardType="numeric" />
            <TextInput label="Teléfono" value={telephone} onChangeText={setTelephone} style={styles.input} mode="outlined" keyboardType="phone-pad" />
            <TextInput label="Horario de Apertura" value={openingHours} onChangeText={setOpeningHours} style={styles.input} mode="outlined" />
            <TextInput label="Capacidad Máxima" value={maximumAttendeeCapacity} onChangeText={setMaximumAttendeeCapacity} style={styles.input} mode="outlined" keyboardType="numeric" />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Acceso Público</Text>
              <Switch value={publicAccess} onValueChange={setPublicAccess} />
            </View>
            <TextInput label="Área de Servicio" value={serviceArea} onChangeText={setServiceArea} style={styles.input} mode="outlined" />
            <TextInput label="Contenido en (ID lugar)" value={containedIn} onChangeText={setContainedIn} style={styles.input} mode="outlined" />
            <TextInput label="Contiene Lugar (ID lugar)" value={containsPlace} onChangeText={setContainsPlace} style={styles.input} mode="outlined" />
            
            <Button
              mode="contained"
              onPress={submit}
              loading={loading}
              disabled={loading}
              style={{marginTop: 16}}
              icon="check-circle"
            >
              {existingPlace ? "Actualizar Lugar" : "Guardar Lugar"}
            </Button>
          </Card.Content>
        </Card>
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
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { width: '100%' },
  input: { marginBottom: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
  },
});
