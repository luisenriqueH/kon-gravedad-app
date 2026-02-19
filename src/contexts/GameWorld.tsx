
import React, { ReactNode, useRef, useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { GameEngine } from 'react-native-game-engine'
import { Button } from 'react-native-paper'

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
  updateRemove?: (keys: string[]) => void,
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
  const roundPoint = 100;

  const mass = 1; // Assuming a mass of 1 for simplicity
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


const distanceLimit = 10000;

const potentialRadius = 10;
const potentialScanRadius = 100;


const speedMinimum = 1/1000;
const collisionScalar = 1/10;

const kineticScalar = 1/10;
const kineticMinimum = 1 / 1000;


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

export default function GameWorld({ children, inputRef, entitiesRef, updateRemove }: Props) {
  const engineRef = useRef<any>(null)
  const idCounter = useRef(0)
  const localEntitiesRef = useRef<any>({})
  const resolvedEntitiesRef = entitiesRef ?? localEntitiesRef

  const [updateTick, setUpdateTick] = useState(0);


  // helper to swap entities into the engine
  const swapEntities = (nextEntities: any) => {
    resolvedEntitiesRef.current = nextEntities
    

    // ✅ Solo usamos el método imperativo del motor. 
    // Esto actualiza los objetos internamente sin reiniciar el componente.
    if (engineRef.current) {
      engineRef.current.swap(nextEntities);
    }
    // setUpdateTick(t => t + 1);
  }

  const addEntity = useCallback((spec: any) => {
    const key = spec.key || `ent_${Date.now()}_${(idCounter.current++)}`
    const entity = {
      key,
      time: spec.time ?? 0,
      mass: spec.mass ?? 1,
      position: spec.position ?? [0, 0],
      velocity: spec.velocity ?? [0, 0],
      size: spec.size ?? 20,
      renderer: spec.renderer ?? <Box key={key} />,
    }
    const next = { ...((resolvedEntitiesRef && resolvedEntitiesRef.current) ? resolvedEntitiesRef.current : {}), [key]: entity }
    swapEntities(next)
    return key
  }, [resolvedEntitiesRef])

  const addEntityWithVelocity = useCallback((pos: { x: number; y: number }, velocity: { x: number; y: number }, opts: any = {}) => {
    const spec = {
      position: [pos.x, pos.y],
      velocity: [velocity.x, velocity.y],
      mass: opts.mass ?? 1,
      size: opts.size ?? 20,
      renderer: opts.renderer ?? undefined,
    }
    return addEntity(spec)
  }, [addEntity])

  const removeEntity = useCallback((key: string) => {
    if (!resolvedEntitiesRef.current || !resolvedEntitiesRef.current[key]) return
    const next = { ...resolvedEntitiesRef.current }
    delete next[key]
    swapEntities(next)
  }, [resolvedEntitiesRef])

  const randomEntity = () => {
    
    const { width, height } = Dimensions.get('window');
    var c = { x: width / 2, y: height / 2 };
    var wt = 2 * Math.random() * Math.PI;
    var r = { x: 600*Math.sin(wt) + c.x, y: 600*Math.cos(wt) + c.y };
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
    if (!inputRef) return
    inputRef.current = inputRef.current ?? ({ paused: false, controller: { x: 0, y: 0 } } as unknown as InputRef)
    inputRef.current.addEntity = addEntity
    inputRef.current.addEntityWithVelocity = addEntityWithVelocity
    inputRef.current.removeEntity = removeEntity
    inputRef.current.randomEntity = randomEntity
  }, [inputRef, resolvedEntitiesRef])

  return (
    <View style={[styles.gameWorld]}>
      <GameEngine ref={engineRef} systems={[createPhysics(inputRef, updateRemove)]} entities={resolvedEntitiesRef.current}
        style={[{ flex: 1, width: '100%' }]}>
        {children}
      </GameEngine>
    </View>
  )
}


const createPhysics = (inputRef: React.RefObject<InputRef>, updateRemove: (keys: string[]) => void) => {
  return (entities: any, { time }: any) => {
    if (inputRef.current?.paused) return entities

    let allImpulse = { }
    let allColisions = { }
    let allMerges = []

    for (const key in entities) {
      if (!Object.hasOwn(entities, key)) continue;
      
      const box = entities[key];
      
      if (box && box.position) {
        const dt = 1 * (time.delta / 16.6667);
        box.time += dt
        const ctrl = inputRef.current?.controller
        if (ctrl) {
          // box.velocity[0] += ctrl.x * dt
          // box.velocity[1] += ctrl.y * dt
        }

        
        let filteredEntities: any[] = Object.values(entities).filter((e:any)=>e.key !== box.key);
        let initialPos = { x: box.position[0], y: box.position[1] };
        let radialPotencial: any = radialPotentialScan(box, filteredEntities);



        let impulse = {
          x: radialPotencial.x * radialPotencial.motion * dt,
          y: radialPotencial.y * radialPotencial.motion * dt,
        }
        let colisions = {
          x:0,y:0
        }
        filteredEntities.forEach(e=>{
          const dx = initialPos.x - e.position[0];
          const dy = initialPos.y - e.position[1];
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 20 && distance > 10) {
            const vx = box.velocity[0]-e.velocity[0];
            const vy = box.velocity[1]-e.velocity[1];
            colisions.x += vx*(-collisionScalar);
            colisions.y += vy*(-collisionScalar);
          } else if (distance <= 10) {
            if (!allMerges.some((m:any)=>m.includes(box.key)&&m.includes(e.key))) {
              allMerges.push([box.key,e.key]);
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
        box.position[0] += box.velocity[0] * dt
        box.position[1] += box.velocity[1] * dt

      }
      
    }
    
    for (const merge of allMerges) {
      if (!Object.hasOwn(entities, merge[0])) continue;
      if (!Object.hasOwn(entities, merge[1])) continue;

      
      const box = entities[merge[0]];
      const circle = entities[merge[1]];


      updateRemove([box.key]);
      inputRef.current?.removeEntity(box.key);

    }
    
    for (const key in entities) {
      if (!Object.hasOwn(entities, key)) continue;
      
      const box = entities[key];
      
      if (box && box.position) {

        let nextPos = { x: box.position[0], y: box.position[1] };
        const kinetic = kineticEnergy(box, nextPos);

        const limit = distanceLimit;
        if (Math.abs(box.velocity[0]) > limit || Math.abs(box.velocity[1]) > limit) {
          inputRef.current?.removeEntity(box.key);
        }

      }
      
    }


    if (time.current - lastCreated.time > 1000) {
      console.log('Creating random entity');
      lastCreated.time = time.current;
      setTimeout(() => {
        inputRef.current?.randomEntity?.();
      }, 0);
    }


    return entities
  }
}

const styles = StyleSheet.create({
  gameWorld: { flex: 1, width: '100%', backgroundColor: '#aaa', justifyContent: 'center', alignItems: 'center' },
  gameObject: { position: 'absolute', backgroundColor: '#fff', borderRadius: 4 },
})