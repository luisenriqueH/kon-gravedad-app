import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import ScreenProvider from '../../contexts/ScreenProvider';
import { useData } from '../../contexts/DataProvider';
import EventService from '../../services/api/EventService';
import { useAuth } from '../../contexts/AuthProvider';
import { Event } from '../../models/event.model';
import { Card, Button, FAB } from 'react-native-paper';
import AuthService from '../../services/api/AuthService';

export default function EventManager({ navigation, route }: any) {
    const { user } = useAuth();
    const { person } = useData();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const query = `owner=${user.id.toString()}`;
            const fetchedEvents = await EventService.searchEvents(AuthService.getBaseUrl(), query);
            setEvents(fetchedEvents || []);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        // Added a listener for focus to refetch events when the user navigates back to the screen
        const unsubscribe = navigation.addListener('focus', () => {
            fetchEvents();
        });

        return unsubscribe;
    }, [fetchEvents, navigation]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const renderEvent = ({ item }: { item: Event }) => {
        const isOwner = String(user?.id) === String(item.owner);

        return (
            <Card style={styles.card}>
                <Card.Cover source={{ uri: (item as any).image || 'https://via.placeholder.com/700x300.png?text=Evento' }} />
                <Card.Title 
                    title={item.name || 'Evento sin Título'} 
                    subtitle={item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Sin fecha'}
                />
                <Card.Actions>
                    <Button onPress={() => navigation.navigate('EventInfo', { event: item, person: person && person[0] })}>
                        Ver
                    </Button>
                    {isOwner && (
                        <Button onPress={() => navigation.navigate('RegisterEvent', { event: item, user })}>
                            Editar
                        </Button>
                    )}
                </Card.Actions>
            </Card>
        );
    };

    if (loading && !refreshing) {
        return (
            <ScreenProvider title="Gestionar Eventos" backButton={true}>
                <ActivityIndicator style={styles.centered} size="large" />
            </ScreenProvider>
        );
    }

    return (
        <ScreenProvider title="Gestionar Eventos" authLock={true} personLock={true} backButton={true}>
            <FlatList
                data={events}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderEvent}
                ListEmptyComponent={<View style={styles.centered}><Text>No has creado ningún evento.</Text></View>}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('RegisterEvent', { user })}
            />
        </ScreenProvider>
    );
}

const styles = StyleSheet.create({
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    listContainer: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
