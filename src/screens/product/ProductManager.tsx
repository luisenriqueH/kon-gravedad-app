import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import ScreenProvider from '../../contexts/ScreenProvider';
import { useData } from '../../contexts/DataProvider';
import ProductService from '../../services/api/ProductService';
import { useAuth } from '../../contexts/AuthProvider';
import { Product } from '../../models/product.model';
import { Card, Button, FAB } from 'react-native-paper';
import AuthService from '../../services/api/AuthService';

export default function ProductManager({ navigation, route }: any) {
    const { user } = useAuth();
    const { person } = useData();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProducts = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const query = `owner=${user.id.toString()}`;
            const fetched = await ProductService.listProducts(AuthService.getBaseUrl(), query);
            const list = Array.isArray(fetched) ? fetched : fetched?.data ?? fetched?.rows ?? [];
            setProducts(list || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProducts();
        });

        return unsubscribe;
    }, [fetchProducts, navigation]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const renderProduct = ({ item }: { item: Product }) => {
        const isOwner = String(user?.id) === String((item as any).owner ?? (item as any).user ?? '');

        return (
            <Card style={styles.card}>
                <Card.Cover source={{ uri: (item as any).image || 'https://via.placeholder.com/700x300.png?text=Producto' }} />
                <Card.Title 
                    title={item.name || (item as any).nombre || 'Producto sin Título'}
                    subtitle={(item as any).sku || ''}
                />
                <Card.Actions>
                    <Button onPress={() => navigation.navigate('ProductInfo', { product: item, person: person && person[0] })}>
                        Ver
                    </Button>
                    {isOwner && (
                        <Button onPress={() => navigation.navigate('RegisterProduct', { product: item, user })}>
                            Editar
                        </Button>
                    )}
                </Card.Actions>
            </Card>
        );
    };

    if (loading && !refreshing) {
        return (
            <ScreenProvider title="Gestionar Productos" backButton={true}>
                <ActivityIndicator style={styles.centered} size="large" />
            </ScreenProvider>
        );
    }

    return (
        <ScreenProvider title="Gestionar Productos" authLock={true} personLock={true} backButton={true}>
            <FlatList
                data={products}
                keyExtractor={(item) => String((item as any).id ?? (item as any).ID ?? JSON.stringify(item))}
                renderItem={renderProduct}
                ListEmptyComponent={<View style={styles.centered}><Text>No has creado ningún producto.</Text></View>}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('RegisterProduct', { user })}
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
