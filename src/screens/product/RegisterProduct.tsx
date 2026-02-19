import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { Button, Card, Snackbar, TextInput, Title } from 'react-native-paper';
import ScreenProvider from '../../contexts/ScreenProvider';
import { useAuth } from '../../contexts/AuthProvider';
import { Product } from '../../models/product.model';
import ProductService from '../../services/api/ProductService';
import AuthService from '../../services/api/AuthService';

export default function RegisterProduct({ navigation, route }: any) {
  const { user } = useAuth();
  const existingProduct: Product = route?.params?.product || null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [sku, setSku] = useState('');
  const [offers, setOffers] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [type, setType] = useState('');
  const [mpn, setMpn] = useState('');
  const [gtin, setGtin] = useState('');
  const [details, setDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', error: false });

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name || '');
      setDescription(existingProduct.description || '');
      setImage(existingProduct.image || '');
      setSku(existingProduct.sku || '');
      setOffers(existingProduct.offers || '');
      setBrand(existingProduct.brand || '');
      setModel(existingProduct.model || '');
      setCategory(existingProduct.category || '');
      setManufacturer(existingProduct.manufacturer || '');
      setType((existingProduct as any).type || '');
      setMpn((existingProduct as any).mpn || '');
      setGtin((existingProduct as any).gtin || '');
      try {
        setDetails(JSON.stringify((existingProduct as any).details || '', null, 2));
      } catch (e) {
        setDetails((existingProduct as any).details || '');
      }
    }
  }, [existingProduct]);

  const submit = async () => {
    if (!name.trim()) {
      setSnackbar({ visible: true, message: 'El nombre del producto es requerido', error: true });
      return;
    }

    setLoading(true);
    try {
      let parsedDetails: any = "{}";
      if (details && details.trim()) {
        try { parsedDetails = JSON.parse(details); } catch (e) { parsedDetails = details; }
      }

      const body: Partial<Product> = {
        name,
        description,
        image,
        sku,
        offers,
        brand,
        model,
        category,
        manufacturer,
        details: parsedDetails,
      } as Partial<Product>;

      if (type) (body as any).type = type;
      if (mpn) (body as any).mpn = mpn;
      if (gtin) (body as any).gtin = gtin;


      if (user?.id) {
        (body as any).owner = Number.parseInt(user.id);
      }

      console.log('Submitting product with body:', body, user);
      const base = AuthService.getBaseUrl();

      if (existingProduct?.id) {
        await ProductService.updateProduct(base, existingProduct.id, body);
      } else {
        await ProductService.uploadProduct(base, body);
      }

      setSnackbar({ visible: true, message: 'Producto guardado correctamente', error: false });
      setTimeout(() => navigation.goBack(), 800);

    } catch (e: any) {
      const errorMessage = e?.message || 'No se pudo guardar el producto';
      setSnackbar({ visible: true, message: errorMessage, error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenProvider title={existingProduct ? "Editar Producto" : "Registrar Producto"} backButton={true}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{existingProduct ? "Edita los Detalles del Producto" : "Crea un Nuevo Producto"}</Title>
            <TextInput label="Nombre" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
            <TextInput label="Descripción" value={description} onChangeText={setDescription} style={[styles.input, { height: 100 }]} mode="outlined" multiline />
            <TextInput label="URL de la Imagen" value={image} onChangeText={setImage} placeholder="https://ejemplo.com/imagen.png" style={styles.input} mode="outlined" />
            <TextInput label="SKU" value={sku} onChangeText={setSku} style={styles.input} mode="outlined" />
            <TextInput label="Ofertas" value={offers} onChangeText={setOffers} style={styles.input} mode="outlined" />
            <TextInput label="Marca" value={brand} onChangeText={setBrand} style={styles.input} mode="outlined" />
            <TextInput label="Modelo" value={model} onChangeText={setModel} style={styles.input} mode="outlined" />
            <TextInput label="Categoría" value={category} onChangeText={setCategory} style={styles.input} mode="outlined" />
            <TextInput label="Fabricante" value={manufacturer} onChangeText={setManufacturer} style={styles.input} mode="outlined" />
            <TextInput label="Tipo" value={type} onChangeText={setType} style={styles.input} mode="outlined" />
            <TextInput label="MPN" value={mpn} onChangeText={setMpn} style={styles.input} mode="outlined" />
            <TextInput label="GTIN" value={gtin} onChangeText={setGtin} style={styles.input} mode="outlined" />
            <TextInput label="Detalles (JSON)" value={details} onChangeText={setDetails} style={[styles.input, { height: 120 }]} mode="outlined" multiline />

            <Button
              mode="contained"
              onPress={submit}
              loading={loading}
              disabled={loading}
              style={{marginTop: 16}}
              icon="check-circle"
            >
              {existingProduct ? "Actualizar Producto" : "Guardar Producto"}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{ backgroundColor: snackbar.error ? '#c62828' : '#4CAF50' }}
      >
        {snackbar.message}
      </Snackbar>
    </ScreenProvider>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { width: '100%' },
  input: { marginBottom: 12 },
});
