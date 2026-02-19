import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import ScreenProvider from '../../contexts/ScreenProvider';
import { Button as PaperButton, TextInput, Card, Title } from 'react-native-paper';
import { useData } from '../../contexts/DataProvider';
import EventService from '../../services/api/EventService';
import { AuthService } from '../../services';
import { Event } from '../../models/event.model';

export default function EventQuery({ navigation }: any) {
  const { person } = useData();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchOrganizer, setSearchOrganizer] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearchPerformed(true);
    const queries: string[] = [];
    if (searchName.trim()) queries.push(`name=${searchName.trim()}`);
    if (searchLocation.trim()) queries.push(`location=${searchLocation.trim()}`);
    if (searchOrganizer.trim()) queries.push(`organizer=${searchOrganizer.trim()}`);
    
    const queryString = queries.join('&');

    try {
      const results = await EventService.searchEvents(AuthService.getBaseUrl(), queryString);
      setEvents(results || []);
    } catch (error) {
      console.error("Error searching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [searchName, searchLocation, searchOrganizer]);

  const renderEvent = ({ item }: { item: Event }) => (
    <Card style={styles.resultCard}>
      <Card.Title 
        title={item.name || 'Evento sin Título'} 
        subtitle={item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Sin fecha'}
      />
      <Card.Actions>
        <PaperButton onPress={() => navigation.navigate('EventInfo', { event: item, person: person && person[0] })}>
          Ver Detalles
        </PaperButton>
      </Card.Actions>
    </Card>
  );

  return (
    <ScreenProvider title="Buscar Eventos" backButton={true}>
      <FlatList
        ListHeaderComponent={
          <Card style={styles.searchCard}>
            <Card.Content>
              <Title>Encuentra un Evento</Title>
              <TextInput
                label="Organizador"
                value={searchOrganizer}
                onChangeText={setSearchOrganizer}
                style={styles.input}
                mode="outlined"
              />
              <PaperButton
                mode="contained"
                onPress={handleSearch}
                loading={loading}
                disabled={loading}
                icon="magnify"
                style={{marginTop: 8}}
              >
                Buscar
              </PaperButton>
            </Card.Content>
          </Card>
        }
        data={events}
        renderItem={renderEvent}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.container}
        ListFooterComponent={
          <>
            {loading && <ActivityIndicator style={{marginTop: 20}} size="large" />}
            {searchPerformed && !loading && events.length === 0 && (
              <View style={styles.centered}>
                <Text>No se encontraron eventos con esos criterios.</Text>
              </View>
            )}
          </>
        }
      />
    </ScreenProvider>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  searchCard: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
  },
  resultCard: {
    marginBottom: 16,
  },
  centered: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
