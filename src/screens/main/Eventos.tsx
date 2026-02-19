import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
// removed useFocusEffect to avoid fetching owned vehicles on every focus
import ScreenProvider from '../../contexts/ScreenProvider';
import { useData } from '../../contexts/DataProvider';

import PersonService from '../../services/api/PersonService';
import EventService from '../../services/api/EventService';

import { Button as PaperButton } from 'react-native-paper'
import { AuthService } from '../../services';
import { useAuth } from '../../contexts/AuthProvider';


export default function Eventos({ navigation }: any) {
  
    const { person } = useData()
    const { user } = useAuth()

    const [events, setEvents] = useState<any[]>([])
    const [organizer, setOrganizer] = useState<string>('kuiil');

    const isManager = user?.rol == 'manager';



    
    useEffect(() => {
      
      var query = `owner=${user?.id.toString()}`;
      console.log('Constructed query:', query);
      // EventService.searchEvents(AuthService.getBaseUrl(),`organizer=${existingOrganizer}`).then((events)=>{
      EventService.searchEvents(AuthService.getBaseUrl(),query).then((events)=>{
        console.log('fetched events:', events)
        setEvents(events);
      }).catch((err)=>{
        console.log('error fetching events:', err)
      });
    },[]);

  return (
    <ScreenProvider title="Eventos" authLock={true} personLock={true} bottomButtons={true}>
      
      
      <View style={styles.buttonWrap}>
        <PaperButton mode="contained" onPress={() => navigation.navigate('EventQuery', { events })}>Buscar Eventos</PaperButton>
      </View>
      {isManager&&(
        <>
          <View style={styles.buttonWrap}>
            <PaperButton mode="contained" onPress={() => navigation.navigate('RegisterEvent', { organizer, user })}>Crear mi Evento</PaperButton>
          </View>
          <View style={styles.buttonWrap}>
            <PaperButton mode="contained" onPress={() => navigation.navigate('EventManager', { events })}>Manejar mis Eventos</PaperButton>
          </View>
        </>
      )}
      
    </ScreenProvider>
  )
}

const styles = StyleSheet.create({
  buttonWrap: { marginVertical: 6 },
  wrap: {
    width: '100%',
    marginTop: 12,
  },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  card: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  sub: { color: '#666', marginTop: 6 },
  currentThumb: {
    width: 160,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginBottom: 8,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  thumbnail: {
    width: 100,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chooseButton: {
    marginLeft: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: 18,
  }
})
