import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
import ScreenProvider from '../../contexts/ScreenProvider';
import ProductService from '../../services/api/ProductService';
import { AuthService as AuthClass } from '../../services/api/AuthService';
import { Button as PaperButton } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthProvider';

export default function Tienda({ navigation }: any) {
  const mountedRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const {user} = useAuth();
  const isManager = user?.rol == 'manager';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ProductService.listProducts(AuthClass.API_BASE, '');
      const list = Array.isArray(res) ? res : res?.data ?? res?.rows ?? [];
      if (!mountedRef.current) return;
      setProducts(list || []);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setProducts([]);
      setError(err?.message ?? String(err));
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProducts();
    return () => { mountedRef.current = false; };
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const renderItem = ({ item }: any) => {
    const title = item.nombre ?? item.name ?? item.titulo ?? String(item.id ?? item.ID ?? '');
    const price = item.precio ?? item.price ?? null;
    // Placeholder for product image. Replace with your actual image source.
    const imageUrl = item.image || 'https://via.placeholder.com/150';

    return (
      <View style={styles.productContainer}>
        <TouchableOpacity style={styles.item} onPress={() => {
          if (navigation?.navigate) navigation.navigate('PurchaseProduct', { product: item });
        }}>
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
          <Text style={styles.itemTitle}>{title}</Text>
          {price != null ? <Text style={styles.price}>{`$${String(price)}`}</Text> : null}
          <PaperButton style={{marginTop: 8}} mode="contained" onPress={() => navigation.navigate('ProductInfo', { product: item })}>Ver</PaperButton>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenProvider title="Tienda" authLock={true} bottomButtons={true}>
        {loading && !refreshing ? (
          <ActivityIndicator size="large" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(i) => String(i.id ?? i.ID ?? JSON.stringify(i))}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={styles.empty}>No hay productos disponibles.</Text>}
            numColumns={2} // Set number of columns to 2 for a grid layout
            contentContainerStyle={styles.listContainer}
          />
        )}
        <View style={styles.headerButtons}>
          {isManager && (
            <PaperButton mode="contained" onPress={() => navigation?.navigate('ProductManager')}>Mis productos</PaperButton>
          )}
        </View>
    </ScreenProvider>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 8,
  },
  productContainer: {
    flex: 1,
    flexDirection: 'column',
    margin: 8,
    maxWidth: '46%', // Approximately 2 items per row with margin
  },
  item: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
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
  ,
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 6,
  }
});