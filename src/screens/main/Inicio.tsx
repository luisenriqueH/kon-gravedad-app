import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import ScreenProvider from '../../contexts/ScreenProvider';
import GameWorld, { Box, initialEnergy, InputRef } from '../../contexts/GameWorld';
import DataService from '../../services/api/DataService';
import GameObject from '../../components/GameObject';


const lastCreated = { time: 0, key: '' };
const LIVES_KEY = 'game:lives';
const LIVES_TS_KEY = 'game:lastLifeTimestamp';

export default function Inicio({ navigation }: any) {
  


  const [hudVisible, setHudVisible] = useState(false);
  const [totalCreated, setTotalCreated] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalMass, setTotalMass] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(initialEnergy);
  const animatedEnergyRef = useRef(new Animated.Value(0));
  const maxEnergy = initialEnergy * 5; // coincide con GameWorld initialEnergy * 5
  const [lives, setLives] = useState<number>(3);
  const [lastLifeTimestamp, setLastLifeTimestamp] = useState<number | null>(Date.now());
  const regenTimerRef = useRef<any>(null);
  const livesRef = useRef<number>(3);
  // game config and rewards
  const gameConfigRef = useRef<any>({
    goodvsevil: 11/10,
    godtimer: 1000,
    fnAngle: () => Math.random(),
    fnMassPotential: (e: any, distance: number) => { const potential = (e.mass ?? 0) / distance; return 2 * potential; }
  });
  const [rewards, setRewards] = useState<any[]>([]);
  const [activeBuffs, setActiveBuffs] = useState<any[]>([]);
  const [tick, setTick] = useState(0);
  const formatMs = (ms: number) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const ss = (totalSec % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }
  // simple tick to update countdown display every second when needed
  useEffect(() => {
    if (!lastLifeTimestamp || lives >= 3) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [lastLifeTimestamp, lives]);
  

  const HUD = ({ children }: { children?: React.ReactNode }) => {
    return (
      <View style={[styles.hudContainer]}>
        {
          false && (hudVisible ? (
            <View style={[styles.hud]}>
              {children}
              <Button mode="contained" onPress={() => setHudVisible(false)}>
                Close HUD
              </Button>
            </View>
          ) : (
            <>
              <Button mode="contained" onPress={() => setHudVisible(true)}>
                Open HUD
              </Button>
            </>
          ))
        }
        {
          true && (
            <View style={{gap:10}}>
              <Button mode="contained" onPress={() => { inputRef.current.paused = !paused; setPaused(p => !p) }}>
                {paused ? 'Iniciar' : 'Pausar'}
              </Button>
              {(!paused && totalEnergy < 1000) && <Button mode="contained" onPress={() => {
                if (livesRef.current <= 0) { Alert.alert('Sin vidas', 'No tienes vidas suficientes para comprar Energía Extra.'); return }
                const ok = inputRef.current?.consumeLife ? inputRef.current.consumeLife(1) : ((): boolean => { livesRef.current = Math.max(0, livesRef.current - 1); setLives(livesRef.current); DataService.set(LIVES_KEY, livesRef.current); if (livesRef.current < 3 && !lastLifeTimestamp) { const now = Date.now(); setLastLifeTimestamp(now); DataService.set(LIVES_TS_KEY, now); } return true })();
                if (ok) setTotalEnergy(e => Math.max(0, e + 10000));
              }}>
                {paused ? 'Iniciar' : 'Energia Extra'}
              </Button>}
              {(!paused && lives < 1) && <Button mode="contained" onPress={async () => {
                // add one life (capped at 3)
                try {
                  if (inputRef.current?.addLives) {
                    inputRef.current.addLives(1)
                  } else {
                    const next = Math.min(3, livesRef.current + 1)
                    livesRef.current = next
                    setLives(next)
                    if (next >= 3) {
                      setLastLifeTimestamp(null)
                      await DataService.set(LIVES_TS_KEY, null)
                    }
                    await DataService.set(LIVES_KEY, livesRef.current)
                  }
                } catch (e) {}
              }}>
                {paused ? 'Iniciar' : 'Agregar Vida'}
              </Button>}
            </View>
          )
        }
      </View>
    );
  }
  
  const inputRef = useRef<InputRef>({ paused: false, controller: { x: 0, y: 0 } })
  const [paused, setPaused] = useState(true)
  inputRef.current.paused = paused
  const { width, height } = Dimensions.get('window');
  const centerRef = useRef<{ x: number; y: number }>({ x: width / 2, y: height / 2 });

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartCenterRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // expose centerRef to GameWorld via inputRef
    if (inputRef && inputRef.current) {
      inputRef.current.centerRef = centerRef as any;
    }
  }, [inputRef]);

  // load persisted lives and compute regen on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const savedLives = await DataService.get(LIVES_KEY);
        const savedTs = await DataService.get(LIVES_TS_KEY);
        const now = Date.now();
        let lv = typeof savedLives === 'number' ? savedLives : 3;
        let last = typeof savedTs === 'number' ? savedTs : now;
        if (lv < 3 && last) {
          const deltaHours = Math.floor((now - last) / 3600000);
          if (deltaHours > 0) {
            lv = Math.min(3, lv + deltaHours);
            last = last + deltaHours * 3600000;
            await DataService.set(LIVES_KEY, lv);
            await DataService.set(LIVES_TS_KEY, last);
          }
        }
        if (mounted) {
          setLives(lv);
          livesRef.current = lv;
          setLastLifeTimestamp(lv >= 3 ? null : last);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false }
  }, []);

  // schedule regen when lives < 3
  useEffect(() => {
    const scheduleNext = () => {
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
      if (livesRef.current >= 3) return;
      const now = Date.now();
      const last = lastLifeTimestamp ?? now;
      const elapsed = now - last;
      const msUntil = 3600000 - (elapsed % 3600000);
      regenTimerRef.current = setTimeout(async () => {
        const newLives = Math.min(3, livesRef.current + 1);
        livesRef.current = newLives;
        setLives(newLives);
        const nextTs = (lastLifeTimestamp ?? Date.now()) + 3600000;
        setLastLifeTimestamp(newLives >= 3 ? null : nextTs);
        await DataService.set(LIVES_KEY, newLives);
        await DataService.set(LIVES_TS_KEY, newLives >= 3 ? null : nextTs);
        scheduleNext();
      }, msUntil);
    }
    scheduleNext();
    return () => { if (regenTimerRef.current) clearTimeout(regenTimerRef.current) }
  }, [lastLifeTimestamp, lives]);

  // expose energy handlers to GameWorld via inputRef so GameWorld delegates
  // energy changes to Inicio (single source of truth)
  useEffect(() => {
    if (!inputRef || !inputRef.current) return;
    inputRef.current.getEnergy = () => totalEnergy;
    inputRef.current.addEnergy = (n: number) => {
      if (typeof n !== 'number' || n <= 0) return;
      setTotalEnergy(e => Math.max(0, e + n));
    }
    inputRef.current.consumeEnergy = (n: number) => {
      if (typeof n !== 'number' || n <= 0) return true;
      let ok = false;
      setTotalEnergy(prev => {
        if (prev >= n) { 
          ok = true;
          return prev - n }
        return prev
      })
      return ok;
    }
    // expose lives API to GameWorld
    inputRef.current.getLives = () => livesRef.current;
    inputRef.current.consumeLife = (n: number) => {
      if (typeof n !== 'number' || n <= 0) return false;
      if (livesRef.current <= 0) return false;
      const next = Math.max(0, livesRef.current - n);
      livesRef.current = next;
      setLives(next);
      // if we dropped below max and have no timestamp, set it to now
      if (next < 3 && !lastLifeTimestamp) {
        const now = Date.now();
        setLastLifeTimestamp(now);
        DataService.set(LIVES_TS_KEY, now);
      }
      DataService.set(LIVES_KEY, livesRef.current);
      return true;
    }
    inputRef.current.addLives = (n: number) => {
      if (typeof n !== 'number' || n <= 0) return;
      const next = Math.min(3, livesRef.current + n);
      livesRef.current = next;
      setLives(next);
      if (next >= 3) {
        setLastLifeTimestamp(null);
        DataService.set(LIVES_TS_KEY, null);
      }
      DataService.set(LIVES_KEY, livesRef.current);
    }
    // expose game config and rewards API
    inputRef.current.getGameConfig = () => gameConfigRef.current;
    inputRef.current.offerReward = (r: any) => {
      setRewards(prev => [...prev, r]);
    }
  }, [inputRef, totalEnergy]);

  // animate energy bar when `totalEnergy` updates
  useEffect(() => {
    Animated.timing(animatedEnergyRef.current, { toValue: totalEnergy, duration: 300, useNativeDriver: false }).start();
  }, [totalEnergy]);
  const handleControl = (vector:any) => {
    inputRef.current.controller = vector;
    setTimeout(() => { inputRef.current.controller = { x: 0, y: 0 } }, 10);


    inputRef.current.randomEntity();
  }

  // apply reward when user taps it
  const applyReward = (id: string) => {
    const rw = rewards.find(r => r.id === id);
    if (!rw) return;
    // remove reward from list
    setRewards(prev => prev.filter(r => r.id !== id));
    // decide effect
    const type = rw.type;
    const tier = rw.tier;
    const dur = rw.duration || (tier === 'gold' ? 60000 : (tier === 'silver' ? 30000 : 10000));

    const apply = () => {
      const cfg = gameConfigRef.current;
      if (type === 'good_inc') {
        const prev = cfg.goodvsevil;
        cfg.goodvsevil = prev * 10;
        return () => { cfg.goodvsevil = prev }
      }
      if (type === 'good_dec') {
        const prev = cfg.goodvsevil;
        cfg.goodvsevil = prev * 0.5;
        return () => { cfg.goodvsevil = prev }
      }
      if (type === 'godtimer_dec') {
        const prev = cfg.godtimer;
        cfg.godtimer = Math.max(200, Math.floor(prev * 0.5));
        return () => { cfg.godtimer = prev }
      }
      if (type === 'godtimer_inc') {
        const prev = cfg.godtimer;
        cfg.godtimer = Math.floor(prev * 10);
        return () => { cfg.godtimer = prev }
      }
      if (type === 'angle_change') {
        const prev = cfg.fnAngle;
        // pick alternative angle function
        const fns = [() => Math.random(), () => Math.sin(Math.random() * Math.PI), () => Math.random() * 2 - 1, () => 0.5];
        cfg.fnAngle = fns[Math.floor(Math.random() * fns.length)];
        return () => { cfg.fnAngle = prev }
      }
      if (type === 'massPotential_inc') {
        const prev = cfg.fnMassPotential;
        cfg.fnMassPotential = (e: any, distance: number) => prev(e, distance) * 2;
        return () => { cfg.fnMassPotential = prev }
      }
      return () => {}
    }

    const revert = apply();
    const buff = { id: `buff_${Date.now()}`, type, tier, expiresAt: Date.now() + dur };
    setActiveBuffs(b => [...b, buff]);
    setTimeout(() => {
      try { revert(); setActiveBuffs(b => b.filter(x => x.id !== buff.id)); } catch (e) {}
    }, dur);
  }



  
  const initialEntities = {
    // box: { key: 'box', time: 100 * Math.PI, mass: 1, position: [450, 400], velocity: [0, 0], size: 30, renderer: <Box key="box" /> },
    // circle: { key: 'circle', time: 0, mass: 1, position: [50, 400], velocity: [0, 0], size: 30, renderer: <Box key="circle" /> },
    // triangle: { key: 'triangle', time: 50 * Math.PI, mass: 1, position: [200, 200], velocity: [0, 0], size: 30, renderer: <Box key="triangle" /> },
  }
  // keep a mutable reference to current entities so we can add/remove dynamically
  const entitiesRef = useRef<any>({ ...initialEntities })



  return (
    <ScreenProvider bottomButtons={true} style={{padding:0}} contentStyle={{flex:1,padding:0,paddingInline:0}}>
      <View style={[styles.container]} 
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const { pageX, pageY } = e.nativeEvent;
            dragStartRef.current = { x: pageX, y: pageY };
            dragStartCenterRef.current = { ...centerRef.current };
          }}
          onResponderMove={(e) => {
            const { pageX, pageY } = e.nativeEvent;
            if (!dragStartRef.current || !dragStartCenterRef.current) return;
            const dx = pageX - dragStartRef.current.x;
            const dy = pageY - dragStartRef.current.y;
            // Move center proportional to drag delta, scaled by current zoom (world delta = screenDelta / zoom)
            const zoom = inputRef.current.getZoom ? inputRef.current.getZoom() : (inputRef.current as any).zoom ?? 1;
            const factor = 1 ;
            const newCenter = { x: dragStartCenterRef.current.x + dx * factor, y: dragStartCenterRef.current.y + dy * factor };
            centerRef.current = newCenter;
            // notify GameWorld to re-render overlays
            inputRef.current.setCenter?.(newCenter);
          }}
          onResponderRelease={() => { dragStartRef.current = null; dragStartCenterRef.current = null; }}>

        <View style={styles.livesContainer} pointerEvents="none">
          <Text style={styles.statsText}>
            Vidas: {lives} ❤️{lastLifeTimestamp && lives < 3 ? ` • Próx: ${formatMs(Math.max(0, 3600000 - (Date.now() - lastLifeTimestamp)))}` : ''}
          </Text>
        </View>
        <View style={styles.statsContainer} pointerEvents="none">
          <Text style={styles.statsText}>Cuerpos: {activeCount} • Masa: {Math.round(totalMass)} • KE: {Math.round(totalEnergy)}</Text>
        </View>

        {/* Energy bar (moved from GameWorld) */}
        <View style={styles.energyBarContainer} pointerEvents="none">
          <View style={styles.energyBarFill}>
            <Animated.View style={{ height: 12, backgroundColor: '#66ff66', width: animatedEnergyRef.current.interpolate({ inputRange: [0, maxEnergy], outputRange: ['0%', '100%'], extrapolate: 'clamp' }) }} />
          </View>
          <Text style={{ color: '#fff', fontSize: 12, position: 'absolute', alignSelf: 'center' }}>{Math.round(totalEnergy || 0)} E</Text>
        </View>
        
        <HUD>
          <Text style={styles.title}>¡Bienvenido a tu panel de control!</Text>
          <Button mode="contained" onPress={() => { inputRef.current.paused = !paused; setPaused(p => !p) }}>
            {paused ? 'Reanudar' : 'Pausar'}
          </Button>
        </HUD>
        <GameWorld
          inputRef={inputRef}
          entitiesRef={entitiesRef}
          onStatsChange={({ totalCreated, activeCount, totalMass, totalEnergy }) => {

            setTotalCreated(totalCreated);
            setActiveCount(activeCount);
            setTotalMass(totalMass ?? 0);

            // (totalEnergy>0)&&setTotalEnergy(totalEnergy ?? 0);
          }}
        ></GameWorld>
        {/* Active buff indicators (bottom-left) */}
        <View style={styles.buffRow} pointerEvents="none">
          {activeBuffs.map(buff => {
            const remainingMs = Math.max(0, (buff.expiresAt || 0) - Date.now());
            const color = buff.tier === 'gold' ? '#ffd700' : (buff.tier === 'silver' ? '#c0c0c0' : '#cd7f32');
            return (
              <View key={buff.id} style={styles.buffItem}>
                <View style={[styles.buffDot, { backgroundColor: color }]} />
                <Text style={styles.buffLabel}>{(buff.type || '').replace('_',' ')}</Text>
                <Text style={styles.buffTimer}>{formatMs(remainingMs)}</Text>
              </View>
            )
          })}
        </View>

        {/* Reward overlays (clickable) */}
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 40 }} pointerEvents="box-none">
          {rewards.map(rw => {
            const pos = rw.position ?? [width/2, height/2];
            const zoom = inputRef.current?.getZoom ? inputRef.current.getZoom() : (inputRef.current as any).zoom ?? 1;
            const center = centerRef.current ?? { x: width/2, y: height/2 };
            const screenX = (pos[0] - center.x) * zoom + width/2;
            const screenY = (pos[1] - center.y) * zoom + height/2;
            return (
              <TouchableOpacity key={rw.id} style={{ position: 'absolute', left: screenX - 24, top: screenY - 24, width: 48, height: 48, borderRadius: 24, backgroundColor: rw.tier === 'gold' ? '#ffd700' : (rw.tier === 'silver' ? '#c0c0c0' : '#cd7f32'), alignItems: 'center', justifyContent: 'center' }} onPress={() => applyReward(rw.id)}>
                <Text style={{ color: '#000', fontWeight: '700', fontSize: 10 }}>{rw.type.replace('_','\n')}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 20 }} pointerEvents="box-none">

          <Button mode="contained" style={{display:'none'}} onPress={()=>handleControl({ x: 0, y: -1 })}>
            {paused ? 'Subir' : 'Subir'}
          </Button>
        </View>
      </View>
    </ScreenProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  energyBarContainer: { position: 'absolute', zIndex:10, left: 10, right:10, bottom:10, height: 40, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 4, justifyContent: 'center' },
  energyBarFill: { height: 30, backgroundColor: '#333', borderRadius: 6, overflow: 'hidden' },
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
    flex:1, gap:10,
    display:'flex', alignItems:'center', justifyContent:'center',
    borderColor: 'white', borderWidth: 2, borderRadius: 8,
  },
  statsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  livesContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  buffRow: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    zIndex: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    pointerEvents: 'none',
  },
  buffItem: {
    minWidth: 64,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buffDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 4 },
  buffLabel: { color: '#fff', fontSize: 11, fontWeight: '700' },
  buffTimer: { color: '#fff', fontSize: 11 },
  statsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  }
});