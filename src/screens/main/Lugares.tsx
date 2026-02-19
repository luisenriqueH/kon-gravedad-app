import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import ScreenProvider from '../../contexts/ScreenProvider';
import { useAuth } from '../../contexts/AuthProvider';
import { Card, Button, FAB, Title, Paragraph } from 'react-native-paper';
import PlaceService from '../../services/api/PlaceService';
import { Place } from '../../models/place.model';
import { AuthService } from '../../services/api/AuthService';
import { Button as PaperButton } from 'react-native-paper';

export default function Lugares({ navigation }: any) {
    const { user } = useAuth();
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const isManager = user?.rol == 'manager';

    const fetchPlaces = useCallback(async () => {
        if (!refreshing) setLoading(true);
        try {
            // Correctly calling searchPlaces with domain and empty query
            const fetchedPlaces = await PlaceService.searchPlaces(AuthService.API_BASE, '');
            setPlaces(fetchedPlaces || []);
        } catch (error) { 
            console.error("Error fetching places:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

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

    const renderPlace = ({ item }: { item: Place }) => (
        <Card key={item.id} style={styles.card}>
            <Card.Cover source={{ uri: item.image || 'https://via.placeholder.com/700x300.png?text=Lugar' }} />
            <Card.Content>
                <Title>{item.name || 'Lugar sin Nombre'}</Title>
                {item.address && <Paragraph>{item.address}</Paragraph>}
            </Card.Content>
            <Card.Actions>
                <Button onPress={() => navigation.navigate('PlaceInfo', { place: item })}>
                    Ver Detalles
                </Button>
            </Card.Actions>
        </Card>
    );

    if (loading && !refreshing) {
        return (
            <ScreenProvider title="Lugares">
                <ActivityIndicator style={styles.centered} size="large" />
            </ScreenProvider>
        );
    }

    return (
        <ScreenProvider title="Lugares" authLock={true} bottomButtons={true}>
            <FlatList
                data={places}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderPlace}
                ListEmptyComponent={<View style={styles.centered}><Text>No hay lugares para mostrar.</Text></View>}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
            {isManager&&(
                <PaperButton mode="contained" onPress={() => navigation?.navigate('PlaceManager')}>Mis lugares</PaperButton>
            )}
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
