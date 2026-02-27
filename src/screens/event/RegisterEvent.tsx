import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Modal, FlatList, TouchableOpacity, Text, Platform, Linking, Alert } from 'react-native';
import { Snackbar, Button, TextInput, Card, Title, List, Divider, Searchbar } from 'react-native-paper';
import ScreenProvider from '../../contexts/ScreenProvider';
import EventService from '../../services/api/EventService';
import PlaceService from '../../services/api/PlaceService';
import AuthService, { User } from '../../services/api/AuthService';
import { Event } from '../../models/event.model';
import { Place } from '../../models/place.model';
import { Ionicons } from '@expo/vector-icons';
// Load datetimepicker dynamically — fall back to opening the native Calendar app
let DateTimePickerLib: any = null;
try {
  // require at runtime so a missing native module doesn't break Metro reloads
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DateTimePickerLib = require('@react-native-community/datetimepicker');
} catch (e) {
  DateTimePickerLib = null;
}

const DateTimePickerComponent = DateTimePickerLib ? (DateTimePickerLib.default || DateTimePickerLib) : null;

export default function RegisterEvent({ navigation, route }: any) {
  const user: User = route?.params?.user || null;
  const existingEvent: Event = route?.params?.event || null;

  const [name, setName] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [durationHours, setDurationHours] = useState('2'); // default 2 hours
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(''); // Stores the Place ID
  const [selectedPlaceName, setSelectedPlaceName] = useState('Seleccionar lugar');

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', error: false });

  // State for places modal
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPlaces = useCallback(async () => {
    try {
        const fetchedPlaces = await PlaceService.searchPlaces(AuthService.getBaseUrl(), '');
        setPlaces(fetchedPlaces || []);
        setFilteredPlaces(fetchedPlaces || []);
    } catch (error) {
        console.error("Error fetching places:", error);
        setSnackbar({ visible: true, message: 'No se pudieron cargar los lugares', error: true });
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  useEffect(() => {
    if (existingEvent) {
      setName(existingEvent.name || '');
      if (existingEvent.startDate) setSelectedDateTime(new Date(existingEvent.startDate));
      if (existingEvent.endDate && existingEvent.startDate) {
        const start = new Date(existingEvent.startDate).getTime();
        const end = new Date(existingEvent.endDate).getTime();
        const diffHours = Math.round((end - start) / (1000 * 60 * 60));
        setDurationHours(String(diffHours));
      }
      
      setDescription(existingEvent.description || '');
      if (existingEvent.location) {
        setLocation(existingEvent.location);
        PlaceService.getPlace('', existingEvent.location).then(place => {
            if (place) setSelectedPlaceName(place.name);
        }).catch(e => console.error("Failed to fetch event location name", e));
      }
    }
  }, [existingEvent]);

  useEffect(() => {
    const filtered = searchQuery
        ? places.filter(place => place.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : places;
    setFilteredPlaces(filtered);
  }, [searchQuery, places]);

  const formatDate = (d: Date) => d.toLocaleDateString();
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const submit = async () => {
    if (!name.trim() || !location) {
      setSnackbar({ visible: true, message: 'El nombre y la ubicación del evento son requeridos', error: true });
      return;
    }
    if (!selectedDateTime) {
      setSnackbar({ visible: true, message: 'Seleccione la fecha y la hora de inicio', error: true });
      return;
    }

    const hours = Number(durationHours);
    if (isNaN(hours) || hours <= 0) {
      setSnackbar({ visible: true, message: 'Duración inválida', error: true });
      return;
    }

    setLoading(true);
    try {
      const body: Partial<Event> = { 
        name,
        location, // Already the place ID
      };
      
      if (!user?.id) throw new Error("User not identified.");

      body.owner = user.id.toString();
      body.organizer = user.id.toString();
      const start = selectedDateTime ? new Date(selectedDateTime) : undefined;
      if (start) {
        body.startDate = start;
        const end = new Date(start.getTime() + Math.round(hours * 3600 * 1000));
        body.endDate = end;
      }
      if (description) body.description = description;

      if (existingEvent?.id) {
        await EventService.updateEvent(AuthService.getBaseUrl(), existingEvent.id.toString(), body);
      } else {
        await EventService.createEvent(AuthService.getBaseUrl(), body as Event);
      }

      setSnackbar({ visible: true, message: 'Evento guardado correctamente', error: false });
      setTimeout(() => navigation.goBack(), 1000);

    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message || 'No se pudo guardar el evento', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlace = (place: Place) => {
    setLocation(place.id.toString());
    setSelectedPlaceName(place.name || '');
    setModalVisible(false);
  };

  return (
    <ScreenProvider title={existingEvent ? "Editar Evento" : "Registrar Evento"} backButton={true}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput label="Nombre del evento" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, styles.pickerButton]}>
              <Text>{selectedDateTime ? formatDate(selectedDateTime) : 'Seleccionar fecha'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.input, styles.pickerButton]}>
              <Text>{selectedDateTime ? formatTime(selectedDateTime) : 'Seleccionar hora'}</Text>
            </TouchableOpacity>
            {DateTimePickerComponent ? (
              <>
                {showDatePicker && (
                  <DateTimePickerComponent
                    mode="date"
                    value={selectedDateTime || new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                    onChange={(event: any, date: Date | undefined) => {
                      if (date) {
                        const cur = selectedDateTime ? new Date(selectedDateTime) : new Date();
                        cur.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                        setSelectedDateTime(cur);
                      }
                      setShowDatePicker(false);
                    }}
                  />
                )}
                {showTimePicker && (
                  <DateTimePickerComponent
                    mode="time"
                    value={selectedDateTime || new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                    onChange={(event: any, date: Date | undefined) => {
                      if (date) {
                        const cur = selectedDateTime ? new Date(selectedDateTime) : new Date();
                        cur.setHours(date.getHours(), date.getMinutes(), 0, 0);
                        setSelectedDateTime(cur);
                      }
                      setShowTimePicker(false);
                    }}
                  />
                )}
              </>
            ) : (
              // Fallback: open native calendar app (quick test — does not return a date)
              <>
                {showDatePicker && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        if (Platform.OS === 'android') {
                          await Linking.openURL('content://com.android.calendar/time/');
                        } else {
                          await Linking.openURL('calshow:');
                        }
                      } catch (err) {
                        Alert.alert('No se pudo abrir el calendario nativo');
                      }
                      setShowDatePicker(false);
                    }}
                    style={styles.pickerButton}
                  >
                    <Text>Abrir calendario (fecha)</Text>
                  </TouchableOpacity>
                )}
                {showTimePicker && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        if (Platform.OS === 'android') {
                          await Linking.openURL('content://com.android.calendar/time/');
                        } else {
                          await Linking.openURL('calshow:');
                        }
                      } catch (err) {
                        Alert.alert('No se pudo abrir el calendario nativo');
                      }
                      setShowTimePicker(false);
                    }}
                    style={styles.pickerButton}
                  >
                    <Text>Abrir calendario (hora)</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            <TextInput label="Duración (horas)" value={durationHours} onChangeText={setDurationHours} style={styles.input} mode="outlined" keyboardType="numeric" />
            
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.locationPicker}>
                <Text style={styles.locationPickerText}>{selectedPlaceName}</Text>
                <Ionicons name="chevron-down" size={20} color="gray" />
            </TouchableOpacity>

            <TextInput label="Descripción" value={description} onChangeText={setDescription} style={[styles.input, { height: 100 }]} mode="outlined" multiline />
            
            <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={{marginTop: 16}} icon="check-circle">
              {existingEvent ? "Actualizar Evento" : "Guardar Evento"}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Title>Seleccionar Lugar</Title>
          <Searchbar placeholder="Buscar lugar..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchbar}/>
          <FlatList
            data={filteredPlaces}
            keyExtractor={(item) => {
              console.log('Place ID:', item);
              return item.id.toString();
            }}
            renderItem={({ item }) => (
              <List.Item
                key={item.id.toString()}
                title={item.name}
                description={item.address}
                onPress={() => handleSelectPlace(item)}
              />
            )}
            ItemSeparatorComponent={() => <Divider />}
          />
          <Button onPress={() => setModalVisible(false)} style={styles.closeButton}>Cerrar</Button>
        </View>
      </Modal>

      <Snackbar visible={snackbar.visible} onDismiss={() => setSnackbar({ ...snackbar, visible: false })} duration={3000} style={{ backgroundColor: snackbar.error ? '#c62828' : '#4CAF50' }}>
        {snackbar.message}
      </Snackbar>
    </ScreenProvider>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { width: '100%' },
  input: { marginBottom: 12 },
  locationPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    backgroundColor: '#f6f6f6',
    marginBottom: 12,
  },
  locationPickerText: {
    fontSize: 16
  },
  pickerButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  searchbar: {
    marginBottom: 16,
  },
  closeButton: {
    marginTop: 20,
  }
});