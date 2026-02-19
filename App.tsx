import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { AuthProvider } from './src/contexts/AuthProvider';
import ComponentsProvider from './src/contexts/ComponentsProvider';
import DataProvider from './src/contexts/DataProvider';
import { NavigationContainer, ParamListBase, RouteProp } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useWindowDimensions, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Inicio from './src/screens/main/Inicio';
import Ajustes from './src/screens/main/Ajustes';
import PackageManager from './src/screens/settings/PackageManager';
import Login from './src/screens/auth/Login';
import Register from './src/screens/auth/Register';
import ChangePassword from './src/screens/auth/ChangePassword';
import ChangeEmail from './src/screens/auth/ChangeEmail';
import DeleteAccount from './src/screens/auth/DeleteAccount';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RegisterPerson from './src/screens/person/RegisterPerson';
import Profile from './src/screens/auth/Profile';
import PersonalInfo from './src/screens/person/PersonalInfo';

import EventInfo from './src/screens/event/EventInfo';
import RegisterEvent from './src/screens/event/RegisterEvent';
import ProductInfo from './src/screens/product/ProductInfo';
import RegisterProduct from './src/screens/product/RegisterProduct';

// Import new screens
import Lugares from './src/screens/main/Lugares';
import PlaceInfo from './src/screens/place/PlaceInfo';
import RegisterPlace from './src/screens/place/RegisterPlace';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { width } = useWindowDimensions();
  const isLarge = width >= 768;

  const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const insets = useSafeAreaInsets();
    const bottomHeight = 56 + insets.bottom;

    const containerStyle = isLarge
      ? {
          flexDirection: 'column' as const,
          width: 240,
          backgroundColor: '#fff',
          borderRightWidth: StyleSheet.hairlineWidth,
          borderColor: '#e6e6e6',
          alignItems: 'stretch' as const,
          position: 'absolute' as const,
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
          paddingTop: 12,
        }
      : {
          flexDirection: 'row' as const,
          width: '100%',
          height: bottomHeight,
          backgroundColor: '#fff',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: '#e6e6e6',
          position: 'absolute' as const,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          paddingBottom: insets.bottom,
        };

    const itemStyle = isLarge
      ? { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row' as const, alignItems: 'center' as const }
      : { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 8 };

    return (
      <View style={containerStyle}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          let iconName = 'home-outline';
          if (route.name === 'Eventos') iconName = 'calendar-outline';
          else if (route.name === 'Lugares') iconName = 'location-outline'; // Icon for Lugares
          else if (route.name === 'Tienda') iconName = 'cart-outline';
          else if (route.name === 'Ajustes') iconName = 'settings-outline';
          const label = descriptors[route.key].options.title ?? route.name;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              onPress={() => navigation.navigate(route.name)}
              style={itemStyle}
            >
              <Ionicons name={iconName as any} size={isLarge ? 22 : 24} color={focused ? '#007AFF' : 'gray'} />
              {isLarge ? (
                <Text style={{ marginLeft: 12, color: focused ? '#007AFF' : 'gray' }}>{label}</Text>
              ) : (
                <Text style={{ fontSize: 12, marginTop: 4, color: focused ? '#007AFF' : 'gray' }}>{label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Tab.Navigator
      tabBar={(props) => (false&&(<CustomTabBar {...props} />))}
      screenOptions={{ headerShown: false }}
      sceneContainerStyle={{ marginLeft: isLarge ? 240 : 0 }}
    >
      <Tab.Screen name="Inicio" component={Inicio} />
      {false && <Tab.Screen name="Eventos" component={Eventos} />}
      {false && <Tab.Screen name="Lugares" component={Lugares} />}
      {false && <Tab.Screen name="Tienda" component={Tienda} />}
      <Tab.Screen name="Ajustes" component={Ajustes} />
    </Tab.Navigator>
  );
}

import Eventos from './src/screens/main/Eventos';
import Tienda from './src/screens/main/Tienda';
import PurchaseProduct from './src/screens/store/PurchaseProduct';
import EventManager from './src/screens/event/EventManager';
import EventQuery from './src/screens/event/EventQuery';
import ProductManager from './src/screens/product/ProductManager';
import PlaceManager from './src/screens/place/PlaceManager';

        
export default function App() {
  return (
    <ComponentsProvider>
      <NavigationContainer>
        <AuthProvider>
          <DataProvider>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={MainTabs} />


              
              <Stack.Screen name="Profile" component={Profile} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Register" component={Register} />
              <Stack.Screen name="ChangePassword" component={ChangePassword} />
              <Stack.Screen name="ChangeEmail" component={ChangeEmail} />
              <Stack.Screen name="DeleteAccount" component={DeleteAccount} />


              <Stack.Screen name="PersonalInfo" component={PersonalInfo} />
              <Stack.Screen name="RegisterPerson" component={RegisterPerson} />

              

              {/*
              
              <Stack.Screen name="PackageManager" component={PackageManager} />

              <Stack.Screen name="Tienda" component={Tienda} />
              <Stack.Screen name="ProductInfo" component={ProductInfo} />
              <Stack.Screen name="RegisterProduct" component={RegisterProduct} />
              <Stack.Screen name="ProductManager" component={ProductManager} />
              

              <Stack.Screen name="EventInfo" component={EventInfo} />
              <Stack.Screen name="RegisterEvent" component={RegisterEvent} />
              <Stack.Screen name="PurchaseProduct" component={PurchaseProduct} />
              <Stack.Screen name="EventManager" component={EventManager} />
              <Stack.Screen name="EventQuery" component={EventQuery} />
              
              Add Place screens to navigator 
              
              <Stack.Screen name="PlaceInfo" component={PlaceInfo} />
              <Stack.Screen name="RegisterPlace" component={RegisterPlace} />
              <Stack.Screen name="PlaceManager" component={PlaceManager} />*/}


            </Stack.Navigator>
          </DataProvider>
        </AuthProvider>
        <StatusBar style="auto" />
      </NavigationContainer>
    </ComponentsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
