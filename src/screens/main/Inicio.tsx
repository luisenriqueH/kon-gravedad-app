import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import ScreenProvider from '../../contexts/ScreenProvider';
import GameWorld, { Box, InputRef } from '../../contexts/GameWorld';
import GameObject from '../../components/GameObject';


const lastCreated = { time: 0, key: '' };

export default function Inicio({ navigation }: any) {

  console.log('Rendering Inicio');

  const [hudVisible, setHudVisible] = useState(false);
  

  const HUD = ({ children }: { children?: React.ReactNode }) => {
    return (
      <View style={[styles.hudContainer]}>
        {
          hudVisible ? (
            <View style={[styles.hud]}>
              {children}
              <Button mode="contained" onPress={() => setHudVisible(false)}>
                Close HUD
              </Button>
            </View>
          ) : (
            <Button mode="contained" onPress={() => setHudVisible(true)}>
              Open HUD
            </Button>
          )
        }
      </View>
    );
  }
  
  const inputRef = useRef<InputRef>({ paused: false, controller: { x: 0, y: 0 } })
  const [paused, setPaused] = useState(false)
  inputRef.current.paused = paused
  const handleControl = (vector:any) => {
    inputRef.current.controller = vector;
    setTimeout(() => { inputRef.current.controller = { x: 0, y: 0 } }, 10);


    randomEntity();
  }

  const randomEntity = () => {
    
    const { width, height } = Dimensions.get('window');
    var c = { x: width / 2, y: height / 2 };
    var wt = 2 * Math.random() * Math.PI;
    var r = { x: 600*Math.sin(wt) + c.x, y: 600*Math.cos(wt) + c.y };
    var speed = Math.random()+1; // ajusta la magnitud de la velocidad aquí
    var v = { x: -Math.sin(wt) * speed, y: -Math.cos(wt) * speed };
    inputRef.current.addEntityWithVelocity?.(r, v);

  }


  
  const updateRemove = (keys: string[]) => {
    keys.forEach(key => inputRef.current?.removeEntity(key));
  }
  const initialEntities = {
    // box: { key: 'box', time: 100 * Math.PI, mass: 1, position: [450, 400], velocity: [0, 0], size: 30, renderer: <Box key="box" /> },
    // circle: { key: 'circle', time: 0, mass: 1, position: [50, 400], velocity: [0, 0], size: 30, renderer: <Box key="circle" /> },
    // triangle: { key: 'triangle', time: 50 * Math.PI, mass: 1, position: [200, 200], velocity: [0, 0], size: 30, renderer: <Box key="triangle" /> },
  }
  // keep a mutable reference to current entities so we can add/remove dynamically
  const entitiesRef = useRef<any>({ ...initialEntities })

  return (
    <ScreenProvider title="Inicio" bottomButtons={true} style={{padding:0}} contentStyle={{flex:1,padding:0}}>
      <View style={[styles.container]}>
        <HUD>
          <Text style={styles.title}>¡Bienvenido a tu panel de control!</Text>
        </HUD>
        <GameWorld inputRef={inputRef} entitiesRef={entitiesRef} updateRemove={updateRemove}></GameWorld>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 20 }} pointerEvents="box-none">
          <Button mode="contained" onPress={()=>handleControl({ x: 0, y: -1 })}>
            {paused ? 'Subir' : 'Subir'}
          </Button>
          <Button mode="contained" onPress={() => { inputRef.current.paused = !paused; setPaused(p => !p) }}>
            {paused ? 'Reanudar' : 'Pausar'}
          </Button>
        </View>
      </View>
    </ScreenProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 16, color: '#666', marginBottom: 24, textAlign: 'center' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  item: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    marginVertical: 8,
    borderRadius: 5,
    width: '100%',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: 18,
  },
  hudContainer: {
    top: 0, bottom: 30, left: 0, right: 0,
    position:'absolute', zIndex: 10,
    padding: 16, margin: 50,
    pointerEvents:'none',
  },
  hud: {
    backgroundColor: '#ddd',
    flex:1,
    display:'flex', alignItems:'center', justifyContent:'center',
    borderColor: 'white', borderWidth: 2, borderRadius: 8,
  },
  gameWorld: {flex:1, width: '100%', backgroundColor: '#aaa', justifyContent: 'center', alignItems: 'center'},
  gameObject: {width:10, height: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center'},
});