import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Animated, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button } from 'react-native-paper';
import ScreenProvider from '../../contexts/ScreenProvider';
import GameWorld, { Box, initialEnergy, InputRef } from '../../contexts/GameWorld';
import DataService from '../../services/api/DataService';
import GameObject from '../../components/GameObject';


const lastCreated = { time: 0, key: '' };
const LIVES_KEY = 'game:lives';
const LIVES_TS_KEY = 'game:lastLifeTimestamp';

export default function Inicio({ navigation }: any) {
  const [loading, setLoading] = useState(true);

  const now = Date.now();

  return (
    <ScreenProvider bottomButtons={true} style={{ padding: 0 }} contentStyle={{ flex: 1, padding: 0, paddingInline: 0 }}>
      <View style={styles.container}>
        {Platform.OS === 'web' ? (
          <iframe
            src="https://koningo.com/beta/gravedad/orbit/?ver=${now}"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#000'
            }}
            title="Gravity Orbit"
          />
        ) : (
          <WebView
            source={{ uri: `https://koningo.com/beta/gravedad/orbit/?ver=${now}` }}
            style={styles.webview}
            onLoadEnd={() => setLoading(false)}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#66ff66" />
              </View>
            )}
          />
        )}
      </View>
    </ScreenProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: {
    flex: 1,
    backgroundColor: '#000', // Matches the space theme
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});