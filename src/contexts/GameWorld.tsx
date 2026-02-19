
import React, { ReactNode, useRef, useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, Dimensions, Text, Animated } from 'react-native'
import { GameEngine } from 'react-native-game-engine'
import { Button } from 'react-native-paper'

let spawnDistance = 200;
let distanceLimit = 300;

const LEVELS = [
  { masaMinimal: 0, spawnDistance: 200, distanceLimit: 300, zoom: 1.0 },
  { masaMinimal: 5, spawnDistance: 300, distanceLimit: 400, zoom: 0.9 },
  { masaMinimal: 10, spawnDistance: 400, distanceLimit: 500, zoom: 0.8 },
  { masaMinimal: 15, spawnDistance: 500, distanceLimit: 600, zoom: 0.7 },
];

const LEVEL_DISPLAY_DURATION = 1500; // ms
const LEVEL_COOLDOWN = 1500; // ms

const potentialRadius = 10;
const potentialScanRadius = 100;


const speedMinimum = 1/1000;
const collisionScalar = 1/10;

const kineticScalar = 1/10;
const kineticMinimum = 1 / 1000;

export type InputRef = {
  paused: boolean;
  controller: { x: number; y: number };
  addEntity?: (spec: any) => string;
  addEntityWithVelocity?: (pos: { x: number; y: number }, velocity: { x: number; y: number }, opts?: any) => string;
  removeEntity?: (key: string) => void;
  randomEntity?: () => void;
}

type Props = {
  children?: ReactNode,
  inputRef?: React.RefObject<InputRef>,
  entitiesRef?: React.RefObject<any>,
  onStatsChange?: (stats: { totalCreated: number; activeCount: number; totalMass?: number; totalEnergy?: number }) => void,
}

export const Box = (props: any) => {
  const { time = 0, position = [0, 0], velocity = [0, 0], size = 20 } = props
  const x = position[0]
  const y = position[1]
  return (
    <View style={[styles.gameObject, { width: size, height: size }, { left: x - size / 2, top: y - size / 2 }]} />
  )
}

const orbitArround = (box, center, radius) => {
  const w = 1/100
  const wt = box.time * w;
  var x = radius.x * Math.sin(wt) + center.x
  var y = radius.y * Math.cos(wt) + center.y

  return {x, y}
}

const kineticEnergy = (box, nextPos) => {
  const roundPoint = 1000;
  const mass = box.mass ?? 1;
  const vel = { x: nextPos.x-box.position[0], y: nextPos.y-box.position[1] };
  const k = mass * (vel.x**2 + vel.y**2);
  const kinetic = Math.round(roundPoint * k)/roundPoint;

  return kinetic
}


const radialScan = (center, radius, fn?) => {
  
  // generateAngles returns `count` angles evenly spaced around the circle (radians)
  const generateAngles = (count: number, start = 0) => {
    const step = (2 * Math.PI) / count
    return Array.from({ length: count }, (_, i) => start + i * step)
  }
  
  const angles = generateAngles(36)
  const points = angles.map(angle => {
    const x = radius.x * Math.sin(angle) + center.x
    const y = radius.y * Math.cos(angle) + center.y
    return { x, y, angle }
  })

  fn && points.forEach(p=>fn(p))
  
  return points
}
const radialScanTarget = (center, radius, fn?) => {
  const points = radialScan(center, radius);
  let best: any = { point: null, potential: -Infinity };
  let worst: any = { point: null, potential: Infinity };
  for (const p of points) {
    const pot = fn ? fn(p) : 0;
    if (pot > best.potential) best = { point: p, potential: pot };
    if (pot < worst.potential) worst = { point: p, potential: pot };
  }
  const delta = (best.potential === -Infinity || worst.potential === Infinity) ? 0 : best.potential - worst.potential;
  return { best, worst, delta, points };
}
const potentialForce = () => {
  
}



const potentialPoint = (point, entities) => {
        
  let potential = 0

  for (const element of entities) {
    const dx = point.x - element.position[0];
    const dy = point.y - element.position[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > potentialRadius) {
      const g = element.mass / distance;
      potential += g;
    } else {
      potential += 0;
    }
    
  }
  
  return potential;
}

const radialPotentialScan = (box, filteredEntities, fn?) => {
  const r = potentialScanRadius;
  const k = kineticScalar;

  const radius = { x: r, y: r };


  let initialPos = { x: box.position[0], y: box.position[1] };
  //nextPos = orbitArround(box, center, radius);

  let currentVelocity = { x: box.velocity[0], y: box.velocity[1] };
  let force = { x: 0, y: 0, motion: 0 };

  const { best, worst, delta: potentialRange } = radialScanTarget(initialPos, radius, (p:any) => potentialPoint(p, filteredEntities));
  if (best.point && worst.point && potentialRange > 0) {
    const dx = best.point.x - initialPos.x;
    const dy = best.point.y - initialPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    const du = { x: dx / distance, y: dy / distance };

    const initialPotential = potentialPoint(initialPos, filteredEntities);
    const potential = best.potential;

    const deltaKinetic = (potential - initialPotential) * k;
    let motion = Math.max(deltaKinetic, kineticMinimum);

    // Optionally scale motion by the potential range to emphasize larger gradients
    motion = motion * (1 + potentialRange);

    force = { x: du.x, y: du.y, motion };
  } else {
    force = { x: 0, y: 0, motion: 0 };
  }


  return force;
}

const lastCreated = { time: 0, key: '' };

export default function GameWorld({ children, inputRef, entitiesRef, onStatsChange }: Props) {
  const engineRef = useRef<any>(null)
  const idCounter = useRef(0)
  const totalCreatedRef = useRef(0)
  const localEntitiesRef = useRef<any>({})
  const resolvedEntitiesRef = entitiesRef ?? localEntitiesRef
  
  const [currentLevel, setCurrentLevel] = useState(0);
  const lastLevelTimeRef = useRef(0);
  const [levelVisible, setLevelVisible] = useState(false);
  const [levelText, setLevelText] = useState('');
  const [levelFontSize, setLevelFontSize] = useState(48);
  const topEntityIdRef = useRef<string | null>(null);
  const [penaltyVisible, setPenaltyVisible] = useState(false);
  const [penaltyText, setPenaltyText] = useState('');
  const [penaltyFontSize, setPenaltyFontSize] = useState(36);
  // animated zoom value for smooth transitions
  const animatedZoomRef = useRef(new Animated.Value(1));
  const animatedZoom = animatedZoomRef.current;

  const animateZoom = (toValue: number, duration = 1000) => {
    Animated.timing(animatedZoom, { toValue, duration, useNativeDriver: true }).start();
  }


  // helper to swap entities into the engine
  const swapEntities = (nextEntities: any) => {
    resolvedEntitiesRef.current = nextEntities
    

    // ✅ Solo usamos el método imperativo del motor. 
    // Esto actualiza los objetos internamente sin reiniciar el componente.
    if (engineRef.current) {
      engineRef.current.swap(nextEntities);
    }
    // setUpdateTick(t => t + 1);
    if (onStatsChange) {
        const activeCount = Object.keys(nextEntities ?? {}).length
        const totalMass = Object.values(nextEntities ?? {}).reduce((s:any, e:any) => s + (e?.mass ?? 0), 0)
        const totalEnergy = Object.values(nextEntities ?? {}).reduce((s:any, e:any) => s + (e?.kinetic ?? 0), 0)

        onStatsChange({ totalCreated: totalCreatedRef.current, activeCount, totalMass, totalEnergy:totalEnergy })
    }
  }

  const addEntity = useCallback((spec: any) => {
    const key = spec.key || `ent_${Date.now()}_${(idCounter.current++)}`
    const entity = {
      id: key,
      time: spec.time ?? 0,
      mass: spec.mass ?? 1,
      position: spec.position ?? [0, 0],
      velocity: spec.velocity ?? [0, 0],
      kinetic: 0,
      size: spec.size ?? 20,
      renderer: spec.renderer ?? (<Box key={key} />),
    }
    totalCreatedRef.current += 1
    const next = { ...((resolvedEntitiesRef && resolvedEntitiesRef.current) ? resolvedEntitiesRef.current : {}), [key]: entity }
    swapEntities(next)
    return key
  }, [resolvedEntitiesRef, onStatsChange])

  const addEntityWithVelocity = useCallback((pos: { x: number; y: number }, velocity: { x: number; y: number }, opts: any = {}) => {
    const spec = {
      position: [pos.x, pos.y],
      velocity: [velocity.x, velocity.y],
      mass: opts.mass ?? 1,
      size: opts.size ?? 20,
      renderer: opts.renderer ?? undefined,
      kinetic: 0,
    }
    return addEntity(spec)
  }, [addEntity])

  const removeEntity = useCallback((key: string) => {
    if (!resolvedEntitiesRef.current || !resolvedEntitiesRef.current[key]) return
    const next = { ...((resolvedEntitiesRef && resolvedEntitiesRef.current) ? resolvedEntitiesRef.current : {}) }
    delete next[key]
    swapEntities(next)
  }, [resolvedEntitiesRef, onStatsChange])

  const randomEntity = () => {
    
    const { width, height } = Dimensions.get('window');
    var c = { x: width / 2, y: height / 2 };
    var wt = 2 * Math.random() * Math.PI;
    var r = { x: spawnDistance*Math.sin(wt) + c.x, y: spawnDistance*Math.cos(wt) + c.y };
    var speed = Math.random()+1; // ajusta la magnitud de la velocidad aquí
    var v = { x: -Math.sin(wt) * speed, y: -Math.cos(wt) * speed };
    inputRef.current?.addEntityWithVelocity?.(r, v);

  }
  // ensure a resolved inputRef exists synchronously so callers can invoke methods early
  if (inputRef && !inputRef.current) {
    inputRef.current = { paused: false, controller: { x: 0, y: 0 } } as unknown as InputRef
  }


  // expose helpers on inputRef and ensure refs are initialized on mount
  useEffect(() => {
    if (!resolvedEntitiesRef.current) resolvedEntitiesRef.current = {}
    totalCreatedRef.current = Object.keys(resolvedEntitiesRef.current ?? {}).length
    if (onStatsChange) {
      const activeCount = Object.keys(resolvedEntitiesRef.current ?? {}).length
      const totalMass = Object.values(resolvedEntitiesRef.current ?? {}).reduce((s:any, e:any) => s + (e?.mass ?? 0), 0)
      const totalEnergy = Object.values(resolvedEntitiesRef.current ?? {}).reduce((s:any, e:any) => s + (e?.kinetic ?? 0), 0)
      onStatsChange({ totalCreated: totalCreatedRef.current, activeCount, totalMass, totalEnergy })
    }
    if (!inputRef) return
    inputRef.current = inputRef.current ?? ({ paused: false, controller: { x: 0, y: 0 } } as unknown as InputRef)
    inputRef.current.addEntity = addEntity
    inputRef.current.addEntityWithVelocity = addEntityWithVelocity
    inputRef.current.removeEntity = removeEntity
    inputRef.current.randomEntity = randomEntity
  }, [inputRef, resolvedEntitiesRef, addEntity, addEntityWithVelocity, removeEntity, randomEntity, onStatsChange])

  const handleLevelUp = (topMass: number, topSize: number) => {
    const nextLevelIndex = currentLevel; // levels are 0-based in LEVELS
    const nextLevel = LEVELS[nextLevelIndex];
    if (!nextLevel) return;
    if (topMass >= nextLevel.masaMinimal) {
      const now = Date.now();
      if (now - lastLevelTimeRef.current < LEVEL_COOLDOWN) return;
      lastLevelTimeRef.current = now;
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      // update global spawn/distance so systems use new values
      spawnDistance = nextLevel.spawnDistance;
      distanceLimit = nextLevel.distanceLimit;
      // show central number equal to the mass threshold (e.g., "5")
      setLevelText(String(nextLevel.masaMinimal));
      const fs = Math.min(Math.max((topSize || 20) * 0.8, 24), 220);
      setLevelFontSize(fs);
      setLevelVisible(true);
      setTimeout(() => setLevelVisible(false), LEVEL_DISPLAY_DURATION);
      // compute zoom: base level zoom adjusted by topSize (bigger size -> zoom out a bit)
      const baseZoom = typeof nextLevel.zoom === 'number' ? nextLevel.zoom : 1;
      const sizeFactor = Math.min(1.0, 40 / (topSize || 20));
      const finalZoom = Math.max(0.4, Math.min(1.5, baseZoom * sizeFactor));
      animateZoom(finalZoom);
      if (newLevel === 1) console.log('Entraste en el primer nivel');
    }
  }

  // createPhysics uses module-level accumulators but needs to call handleLevelUp
  const createPhysicsLocal = (inputRefInner: React.RefObject<InputRef>) => {
    return (entities: any, { time }: any) => {
      if (inputRefInner.current?.paused) return entities

      const { width, height } = Dimensions.get('window')
      const center = { x: width / 2, y: height / 2 }


      for (const key in entities) {
        if (!Object.hasOwn(entities, key)) continue;
        
        const box = entities[key];
        
        if (box && box.position) {
          const dt = 1 * (time.delta / 16.6667);
          box.time += dt
          const ctrl = inputRefInner.current?.controller
          if (ctrl) {
            // box.velocity[0] += ctrl.x * dt
            // box.velocity[1] += ctrl.y * dt
          }

          
          let filteredEntities: any[] = Object.values(entities).filter((e:any)=>e.id !== box.id);
          let initialPos = { x: box.position[0], y: box.position[1] };
          let radialPotencial: any = radialPotentialScan(box, filteredEntities);

          const m = box.mass ?? 1
          let impulse = {
            x: (radialPotencial.x * radialPotencial.motion * dt) / m,
            y: (radialPotencial.y * radialPotencial.motion * dt) / m,
          }
          let colisions = {
            x:0,y:0
          }
          filteredEntities.forEach(e=>{
            const dx = initialPos.x - e.position[0];
            const dy = initialPos.y - e.position[1];
            const distance = Math.sqrt(dx * dx + dy * dy);

            const size = (box.size / 2);
            if (distance < size*2 && distance > size) {
              const vx = box.velocity[0]-e.velocity[0];
              const vy = box.velocity[1]-e.velocity[1];
              const massFactor = (e.mass ?? 1) / (box.mass ?? 1);
              colisions.x += vx * (-collisionScalar) * massFactor;
              colisions.y += vy * (-collisionScalar) * massFactor;
            } else if (distance <= size) {
              if (!allMerges.some((m:any)=>m.includes(box.id)&&m.includes(e.id))) {
                allMerges.push([box.id,e.id]);
              }
            }
          });
          

          allImpulse[key] = impulse;
          allColisions[key] = colisions;

        }
        
      }
      for (const key in entities) {
        if (!Object.hasOwn(entities, key)) continue;
        
        const box = entities[key];
        
        if (box && box.position) {
          const dt = 1 * (time.delta / 16.6667);
          box.time += dt

          const impulse = allImpulse[key] || { x: 0, y: 0 };
          const colisions = allColisions[key] || { x: 0, y: 0 };

          box.velocity[0] += impulse.x + colisions.x;
          box.velocity[1] += impulse.y + colisions.y;


          if (Math.abs(box.velocity[0]) < speedMinimum) box.velocity[0] = 0;
          if (Math.abs(box.velocity[1]) < speedMinimum) box.velocity[1] = 0;


          // box.position[0] = nextPos.x;
          // box.position[1] = nextPos.y;


          const inicialPos = { x: box.position[0], y: box.position[1] };
          box.position[0] += box.velocity[0] * dt
          box.position[1] += box.velocity[1] * dt

          const kinetic = kineticEnergy(box, inicialPos);
          kinetic&&(allEnergy[key] = {kinetic});

          kinetic && (box.kinetic = kinetic);

        }
        
      }
      
      for (const merge of allMerges) {
        if (!Object.hasOwn(entities, merge[0])) continue;
        if (!Object.hasOwn(entities, merge[1])) continue;

        
        const box = entities[merge[0]];
        const circle = entities[merge[1]];


        const mergeMass = (box,circle) => {
          box.mass += circle.mass;
          box.size += circle.size/3;

          circle.mass = 0;
          circle.size = 0;

          inputRefInner.current?.removeEntity(circle.id);
        }

        if (box.mass > 0 && circle.mass > 0) {
          
          if (box.mass >= circle.mass) {
            mergeMass(box,circle);
          } else {
            mergeMass(circle,box);
          }

        }


      }
      
      // After merges, compute top entity mass to detect level ups
      let topMass = 0;
      let topSize = 20;
      for (const key in entities) {
        if (!Object.hasOwn(entities, key)) continue;
        const b = entities[key];
        if (b && typeof b.mass === 'number' && b.mass > topMass) {
          topMass = b.mass;
          topSize = b.size ?? topSize;
          topEntityIdRef.current = b.id;
        }
      }

      if (topMass > 0) {
        handleLevelUp(topMass, topSize);
      }
      // Level down: if currentLevel > 0 and topMass is below the required threshold, drop a level
      if (currentLevel > 0) {
        const required = LEVELS[currentLevel - 1]?.masaMinimal ?? Infinity;
        if ((topMass || 0) < required) {
          const now = Date.now();
          if (now - lastLevelTimeRef.current >= LEVEL_COOLDOWN) {
            lastLevelTimeRef.current = now;
            const newLevel = Math.max(0, currentLevel - 1);
            setCurrentLevel(newLevel);
            if (newLevel === 0) {
              spawnDistance = 200;
              distanceLimit = 300;
              animateZoom(1);
            } else {
              const lvl = LEVELS[newLevel - 1];
              spawnDistance = lvl.spawnDistance;
              distanceLimit = lvl.distanceLimit;
              animateZoom(lvl.zoom ?? 1);
            }
          }
        }
      }
      
      for (const key in entities) {
        if (!Object.hasOwn(entities, key)) continue;
        
        const box = entities[key];
        
        if (box && box.position) {

          let deltaPos = { x: box.position[0]-center.x, y: box.position[1]-center.y };

          const limit = distanceLimit;
          if (Math.abs(deltaPos.x) > limit || Math.abs(deltaPos.y) > limit) {
            // if the entity leaving is the current top entity, show penalty (negative mass)
            if (box.id && topEntityIdRef.current === box.id) {
              const massVal = Math.round(box.mass ?? 0);
              
              if (massVal < 3) { continue; } // no penalty for small entities
              setPenaltyText(`-${massVal}`);
              const pfs = Math.min(Math.max((box.size ?? 20) * 0.6, 18), 180);
              setPenaltyFontSize(pfs);
              setPenaltyVisible(true);
              setTimeout(() => setPenaltyVisible(false), LEVEL_DISPLAY_DURATION);
            }
            inputRefInner.current?.removeEntity(box.id);
          }

        }
        
      }


      if (time.current - lastCreated.time > 1000) {
        lastCreated.time = time.current;
        setTimeout(() => {
          inputRefInner.current?.randomEntity?.();
        }, 0);
      }


      return entities
    }
  }

  return (
    (() => {
      const { width, height } = Dimensions.get('window')
      const center = { x: width / 2, y: height / 2 }
      return (
        <View style={[styles.gameWorld]}>
          <View pointerEvents="none" style={{
            left:0, top:0, width, height,
            position:'absolute',display:'flex', zIndex: 0
            }}>
            <View style={[styles.circle, { width: spawnDistance * 2, height: spawnDistance * 2, left: center.x - spawnDistance, top: center.y - spawnDistance, borderRadius: spawnDistance, borderColor: 'rgba(255,255,255,0.16)' }]} />
            <View style={[styles.circle, { width: distanceLimit * 2, height: distanceLimit * 2, left: center.x - distanceLimit, top: center.y - distanceLimit, borderRadius: distanceLimit, borderColor: 'rgba(255,255,255,0.08)' }]} />
          </View>
          <Animated.View style={{ flex: 1, width: '100%', transform: [{ scale: animatedZoom }], justifyContent: 'center' }}>
            <GameEngine ref={engineRef} systems={[createPhysicsLocal(inputRef)]} entities={resolvedEntitiesRef.current}
              style={[{ flex: 1, width: '100%' }]}>
              {children}
            </GameEngine>
          </Animated.View>

          {/* Level indicator overlay */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 20 }]}>
            {levelVisible && (
              <Text style={{ fontSize: levelFontSize, color: '#ffffff', fontWeight: '700' }}>{levelText}</Text>
            )}
            {penaltyVisible && (
              <Text style={{ fontSize: penaltyFontSize, color: '#ff6666', fontWeight: '700', marginTop: 8 }}>{penaltyText}</Text>
            )}
          </View>
        </View>
      )
    })()
  )
}



let allImpulse = { }
let allColisions = { }
let allEnergy = { }
let allMerges = []

const styles = StyleSheet.create({
  gameWorld: { flex: 1, width: '100%', backgroundColor: '#aaa', justifyContent: 'center', alignItems: 'center' },
  gameObject: { position: 'absolute', backgroundColor: '#fff', borderRadius: '50%', zIndex:100 },
  circle: { position: 'absolute', borderWidth: 1, backgroundColor: 'transparent' },
})