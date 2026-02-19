import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenProvider from '../../contexts/ScreenProvider';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { Product } from '../../models/product.model';
import { useAuth } from '../../contexts/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

const InfoRow = ({ icon, label, value }: { icon: any, label: string, value: any }) => (
  value ? (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} style={styles.icon} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  ) : null
);

export default function ProductInfo({ route, navigation }: any) {
  const { user } = useAuth();
  const product: Product = route?.params?.product || null;
  const [loading, setLoading] = useState(false);

  if (!product) {
    return (
      <ScreenProvider title="Error" backButton={true}>
        <View style={styles.centered}><Text>Producto no encontrado.</Text></View>
      </ScreenProvider>
    );
  }

  const isOwner = user && product.owner && user.id.toString() === String(product.owner);

  return (
    <ScreenProvider title="Información del Producto" backButton={true}>
      <ScrollView>
        <Card>
          <Card.Cover source={{ uri: product.image || 'https://via.placeholder.com/700x300.png?text=Producto' }} />
          <Card.Content>
            <Title style={styles.title}>{product.name || 'Producto sin nombre'}</Title>

            {product.description && (
              <View style={styles.descriptionContainer}>
                <Paragraph>{product.description}</Paragraph>
              </View>
            )}

            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Detalles</Title>
              <InfoRow icon="pricetags-outline" label="SKU" value={product.sku} />
              <InfoRow icon="business-outline" label="Marca" value={product.brand} />
              <InfoRow icon="cube-outline" label="Modelo" value={product.model} />
              <InfoRow icon="layers-outline" label="Categoría" value={product.category} />
              <InfoRow icon="construct-outline" label="Fabricante" value={product.manufacturer} />
              <InfoRow icon="flash-outline" label="Ofertas" value={product.offers} />
              <InfoRow icon="git-branch-outline" label="Tipo" value={(product as any).type} />
              <InfoRow icon="barcode-outline" label="MPN" value={(product as any).mpn} />
              <InfoRow icon="barcode-outline" label="GTIN" value={(product as any).gtin} />
              <InfoRow icon="person-outline" label="Owner" value={product.owner} />
              <InfoRow icon="time-outline" label="Creado" value={(product as any).fecha_creacion} />
              <InfoRow icon="time-outline" label="Actualizado" value={(product as any).fecha_actualizacion} />
              <InfoRow icon="trash-outline" label="Eliminado" value={(product as any).eliminado ? 'Sí' : 'No'} />
            </View>

            {(product as any).details && (
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Detalles Específicos</Title>
                <Paragraph>{JSON.stringify((product as any).details, null, 2)}</Paragraph>
              </View>
            )}

          </Card.Content>
          <Card.Actions style={styles.actions}>
            {isOwner && (
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => navigation.navigate('RegisterProduct', { product })}
              >
                Editar Producto
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
