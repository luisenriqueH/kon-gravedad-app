import { useEffect, useRef } from "react";
import { Animated, TouchableOpacity, StyleSheet, View } from "react-native";
import { criticalMass, potentialRadius, potentialScanRadius } from "./GameWorld";

const bodyVolumen = (mass: number) => {
    const m = 20 * (mass ?? 1) / 3;
    return Math.min(1000, Math.max(1, m));
}

const Box = (props: any) => {
  const { time = 0, position = [0, 0], velocity = [0, 0], size = 20 } = props
  const x = position[0]
  const y = position[1]
  return (
    <View style={[styles.gameObject, { width: size, height: size }, { left: x - size / 2, top: y - size / 2 }]} />
  )
}

const MassBody = (props: any) => {
  const { id, time = 0, position = [0, 0], velocity = [0, 0], size = 20, mass = 1, kinetic = 0, inputRef } = props;
  const effectiveInputRef = inputRef;
  const x = position[0]
  const y = position[1]
  const dx = velocity[0]
  const dy = velocity[1]
  const speed = Math.sqrt(dx*dx+dy*dy);
  const angleRotate = Math.atan2(dy, dx) + Math.PI / 1;
  
  const isLarge = (mass ?? 0) >= criticalMass;
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!isLarge) return
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
    ])).start()
  }, [isLarge, pulse])

  const handlePress = () => {
    try { if (effectiveInputRef && effectiveInputRef.current && effectiveInputRef.current.convertMassToEnergy) effectiveInputRef.current.convertMassToEnergy(id) } catch (e) {}
  }

  const collisionStyle = {position:'absolute', left:0, top:0, width:potentialRadius*(size/2),height:potentialRadius*(size/2),backgroundColor:'#ffffff55',borderRadius:'50%'};
  const scanStyle = {position:'absolute', left:-potentialRadius*(size/4), top:-potentialRadius*(size/4), width:potentialScanRadius*(size/2),height:potentialScanRadius*(size/2),backgroundColor:'#ffffff55',borderRadius:'50%'};

  const isDebug = false;

  return (
    <TouchableOpacity activeOpacity={0.8} disabled={!isLarge} onPress={() => handlePress()} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2 }}>
      <Animated.View style={[styles.gameObject, { width: size, height: size, transform: [{ scale: pulse }], backgroundColor: isLarge ? '#ffcc00' : '#ffff' }]}>
        <View style={{width:speed*50,height:2,transformOrigin: `${size/2}px ${size/2}px`,transform:[{ rotate: `${angleRotate}rad` }],backgroundColor:'#ffffff55'}}></View>
        
        {isDebug&&(
            <>
                <View style={collisionStyle}></View>
                <View style={scanStyle}></View>
            </>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  gameWorld: { flex: 1, width: '100%', backgroundColor: '#aaa', justifyContent: 'center', alignItems: 'center' },
  gameObject: { position: 'absolute', backgroundColor: '#fff', borderRadius: '50%', zIndex:100 },
  circle: { position: 'absolute', borderWidth:10, backgroundColor: 'transparent' },
})

export {MassBody,Box,bodyVolumen};