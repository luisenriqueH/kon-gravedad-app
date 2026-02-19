import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenProvider from '../../contexts/ScreenProvider';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { Place } from '../../models/place.model';
import EventService from '../../services/api/EventService';
import AuthService from '../../services/api/AuthService';
import { useAuth } from '../../contexts/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

const InfoRow = ({ icon, label, value }: { icon: any, label: string, value: any }) => (
    value ? (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={20} style={styles.icon} />
            <Text style={styles.infoLabel}>{label}:</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    ) : null
);

export default function PlaceInfo({ route, navigation }: any) {
  const { user } = useAuth();
  const [loadingEvents, setLoadingEvents] = useState(false);
  const place: Place = route?.params?.place || null;

  if (!place) {
    return (
      <ScreenProvider title="Error" backButton={true}>
        <View style={styles.centered}><Text>Lugar no encontrado.</Text></View>
      </ScreenProvider>
    );
  }

  const isOwner = user && place.owner && user.id.toString() === place.owner.toString();

  return (
    <ScreenProvider title="Información del Lugar" backButton={true}>
      <ScrollView>
        <Card>
          <Card.Cover source={{ uri: place.image || 'https://via.placeholder.com/700x300.png?text=Lugar' }} />
          <Card.Content>
            <Title style={styles.title}>{place.name || 'Lugar sin nombre'}</Title>
            
            {place.description && (
                <View style={styles.descriptionContainer}>
                    <Paragraph>{place.description}</Paragraph>
                </View>
            )}

            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Detalles</Title>
              <InfoRow icon="location-outline" label="Dirección" value={place.address} />
              <InfoRow icon="call-outline" label="Teléfono" value={place.telephone} />
              <InfoRow icon="time-outline" label="Horario" value={place.openingHours} />
              <InfoRow icon="people-outline" label="Capacidad Máxima" value={place.maximumAttendeeCapacity} />
              <InfoRow icon="map-outline" label="Área de Servicio" value={place.serviceArea} />
              <InfoRow icon="log-in-outline" label="Acceso Público" value={place.publicAccess ? 'Sí' : 'No'} />
            </View>

            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Ubicación Geográfica</Title>
              <InfoRow icon="navigate-outline" label="Latitud" value={place.latitude} />
              <InfoRow icon="navigate-outline" label="Longitud" value={place.longitude} />
            </View>
            
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Relaciones</Title>
              <InfoRow icon="expand-outline" label="Contenido En" value={place.containedIn} />
              <InfoRow icon="contract-outline" label="Contiene" value={place.containsPlace} />
            </View>

          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button
              mode="outlined"
              icon="calendar"
              loading={loadingEvents}
              onPress={async () => {
                try {
                  setLoadingEvents(true);
                  const query = place.id ? `location=${encodeURIComponent(String(place.id))}` : (place.name ? `location=${encodeURIComponent(place.name)}` : '')
                  const events = await EventService.searchEvents(AuthService.getBaseUrl(), query)
                  
                  navigation.navigate('EventManager', { events: events || [] })
                } catch (e) {
                  console.error('Error fetching events for place:', e)
                  navigation.navigate('EventManager', { events: [] })
                } finally {
                  setLoadingEvents(false)
                }
              }}
            >
              Ver Eventos en este Lugar
            </Button>

            {isOwner && (
              <Button 
                mode="contained"
                icon="pencil"
                onPress={() => navigation.navigate('RegisterPlace', { place: place })}
              >
                Editar Lugar
              </Button>
            )}
          </Card.Actions>
        </Card>
      </ScrollView>
    </ScreenProvider>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 8, marginBottom: 8 },
  descriptionContainer: { marginVertical: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { marginRight: 8, color: '#555' },
  infoLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  infoValue: { fontSize: 16, marginLeft: 4, flexShrink: 1 },
  actions: { padding: 16, justifyContent: 'flex-end' },
});
