import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import ScreenProvider from '../../contexts/ScreenProvider';
import { useData } from '../../contexts/DataProvider';
import PlaceService from '../../services/api/PlaceService';
import { useAuth } from '../../contexts/AuthProvider';
import { Place } from '../../models/place.model';
import { Card, Button, FAB } from 'react-native-paper';
import AuthService from '../../services/api/AuthService';

export default function PlaceManager({ navigation, route }: any) {
    const { user } = useAuth();
    const { person } = useData();
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPlaces = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const query = `owner=${user.id.toString()}`;
            const fetched = await PlaceService.searchPlaces(AuthService.getBaseUrl(), query);
            const list = Array.isArray(fetched) ? fetched : fetched?.data ?? fetched?.rows ?? [];
            setPlaces(list || []);
        } catch (error) {
            console.error('Error fetching places:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchPlaces();
        });

        return unsubscribe;
    }, [fetchPlaces, navigation]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPlaces();
    };

    const renderPlace = ({ item }: { item: Place }) => {
        const isOwner = String(user?.id) === String((item as any).owner ?? '');

        return (
            <Card style={styles.card}>
                <Card.Cover source={{ uri: (item as any).image || 'https://via.placeholder.com/700x300.png?text=Lugar' }} />
                <Card.Title 
                    title={item.name || 'Lugar sin Título'}
                    subtitle={(item as any).address || ''}
                />
                <Card.Actions>
                    <Button onPress={() => navigation.navigate('PlaceInfo', { place: item, person: person && person[0] })}>
                        Ver
                    </Button>
                    {isOwner && (
                        <Button onPress={() => navigation.navigate('RegisterPlace', { place: item, user })}>
                            Editar
                        </Button>
                    )}
                </Card.Actions>
            </Card>
        );
    };

    if (loading && !refreshing) {
        return (
            <ScreenProvider title="Gestionar Lugares" backButton={true}>
                <ActivityIndicator style={styles.centered} size="large" />
            </ScreenProvider>
        );
    }

    return (
        <ScreenProvider title="Gestionar Lugares" authLock={true} personLock={true} backButton={true}>
            <FlatList
                data={places}
                keyExtractor={(item) => String((item as any).id ?? JSON.stringify(item))}
                renderItem={renderPlace}
                ListEmptyComponent={<View style={styles.centered}><Text>No has creado ningún lugar.</Text></View>}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('RegisterPlace', { user })}
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
