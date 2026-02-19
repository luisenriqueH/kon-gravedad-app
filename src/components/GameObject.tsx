import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'


export default function GameObject({ navigation, deltaTime, force }: any) {
  
  const [position, setPosition] = useState({x:0, y:0});
  const [velocity, setVelocity] = useState({x:0, y:0});


  useCallback(()=>{
    console.log('Updating position with velocity', velocity);
    setPosition({x: position.x + velocity.x, y: position.y + velocity.y});
  },[]);

  useEffect(()=>{
    console.log('Applying force', force, velocity, position);
    setVelocity({x: 0, y: 20});
    setPosition((r)=>({x: r.x + velocity.x, y: r.y + velocity.y}));
  }, [deltaTime]);
  
  return (
    <View style={[styles.gameObject, {transform: [{ translateX: position.x }, { translateY: position.y }]}]}>
      
    </View>
  )
}

const styles = StyleSheet.create({
  gameWorld: {flex:1, width: '100%', backgroundColor: '#aaa', justifyContent: 'center', alignItems: 'center'},
  gameObject: {width:10, height: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center'},
})
