import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import ScreenProvider from '../../contexts/ScreenProvider';
import { Button as PaperButton, Card, Title, Paragraph, List, Snackbar } from 'react-native-paper';
import { Event } from '../../models/event.model';
import { Person } from '../../models/person.model';
import { Place } from '../../models/place.model';
import PersonService from '../../services/api/PersonService';
import PlaceService from '../../services/api/PlaceService';

export default function EventInfo({ route, navigation }: any) {
  const event: Event = route?.params?.event || null;
  const person: Person = route?.params?.person || null;

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [place, setPlace] = useState<Place | null>(null);
  const [placeLoading, setPlaceLoading] = useState(true);

  useEffect(() => {
    if (event?.location) {
      setPlaceLoading(true);
      PlaceService.getPlace('', event.location)
        .then(fetchedPlace => {
          if (fetchedPlace) {
            setPlace(fetchedPlace);
          }
        })
        .catch(error => {
          console.error("Error fetching place details:", error);
        })
        .finally(() => {
          setPlaceLoading(false);
        });
    } else {
      setPlaceLoading(false);
    }
  }, [event?.location]);

  const handleConfirm = async () => {
    if (!person || !event) {
      Alert.alert("Error", "Falta información de la persona o el evento.");
      return;
    }

    setLoading(true);

    try {
      const currentPerformers = Array.isArray(person.performerIn) ? person.performerIn : [];
      
      if (currentPerformers.includes(event.id.toString())) {
        setSnackbar({ visible: true, message: 'Ya has confirmado tu asistencia a este evento.' });
        setLoading(false);
        return;
      }

      const updatedPerson = {
        ...person,
        performerIn: [...currentPerformers, event.id.toString()],
      };

      await PersonService.updatePerson(person.id.toString(), updatedPerson);
      setSnackbar({ visible: true, message: '¡Asistencia confirmada con éxito!' });
    } catch (error) {
      console.error("Error confirming attendance:", error);
      setSnackbar({ visible: true, message: 'Error al confirmar la asistencia.' });
    } finally {
      setLoading(false);
    }
  };

  const navigateToPlace = () => {
    if (place) {
      navigation.navigate('PlaceInfo', { place: place });
    }
  }

  if (!event) {
    return (
      <ScreenProvider title="Error" backButton={true}>
        <View style={styles.centered}><Text>Evento no encontrado.</Text></View>
      </ScreenProvider>
    );
  }

  return (
    <ScreenProvider title="Información del Evento" backButton={true}>
      <ScrollView>
        <Card style={{maxWidth: 500, margin: 16}}>
          <Card.Cover source={{ uri: 'https://via.placeholder.com/700x300.png?text=Evento' }} />
          <Card.Content>
            <Title style={styles.title}>{event.name || 'Evento sin nombre'}</Title>
            
            <TouchableOpacity onPress={navigateToPlace} disabled={!place || placeLoading}>
              <List.Item
                title={placeLoading ? 'Cargando ubicación...' : (place?.name || 'Ubicación no especificada')}
                description={place?.address}
                left={props => <List.Icon {...props} icon="map-marker" />}
                right={props => (place ? <List.Icon {...props} icon="chevron-right" /> : null)}
              />
            </TouchableOpacity>

            <List.Item
              title={event.startDate ? new Date(event.startDate).toLocaleDateString() : 'Fecha no especificada'}
              description={event.startDate ? new Date(event.startDate).toLocaleTimeString() : 'Hora no especificada'}
              left={props => <List.Icon {...props} icon="calendar-clock" />}
            />
            <List.Item
              title={event.organizer || event.owner || 'Organizador no especificado'}
              left={props => <List.Icon {...props} icon="account-group" />}
            />
            
            {event.description && (
                <View style={styles.descriptionContainer}>
                    <Title style={styles.descriptionTitle}>Descripción</Title>
                    <Paragraph>{event.description}</Paragraph>
                </View>
            )}

          </Card.Content>
          {person && (
            <Card.Actions style={styles.actions}>
              <PaperButton
                mode="contained"
                onPress={handleConfirm}
                loading={loading}
                disabled={loading}
                icon="check-circle"
              >
                Confirmar Asistencia
              </PaperButton>
            </Card.Actions>
          )}
        </Card>
      </ScrollView>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </ScreenProvider>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 8, marginBottom: 16 },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
  },
  actions: {
    padding: 16,
    justifyContent: 'center',
  },
});
