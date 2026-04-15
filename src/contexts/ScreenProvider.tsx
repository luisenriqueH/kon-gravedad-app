
import React, { ReactNode } from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconButton } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import UserHeader from '../components/UserHeader'
import { useAuth } from './AuthProvider'
import { useData } from './DataProvider'

type Props = {
  title?: string
  authLock?: boolean
  personLock?: boolean
  backButton?: boolean
  bottomButtons?: boolean
  children?: ReactNode
  style?: ViewStyle,
  contentStyle?: ViewStyle
}

export default function ScreenProvider({ title, authLock, personLock, backButton, bottomButtons, children, style, contentStyle }: Props) {
  const navigation = useNavigation<any>()
  const { user, loading } = useAuth()
  const { person } = useData()
  const insets = useSafeAreaInsets()

  const visible = !authLock || (authLock && !loading && user) || (!authLock && personLock && !loading && person.length > 0)

  // Ajuste de padding inferior para dejar espacio a la botonera nativa
  const containerPadding = { paddingTop: (styles.container as any).padding + insets.top, paddingBottom: (styles.container as any).padding + insets.bottom }
  const footerPadding = { paddingBottom: insets.bottom > 0 ? insets.bottom : 0 }




  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, containerPadding, style]}>
        {/* Top segment: optional back button (left) and UserHeader (right when authLock) */}
        <View style={styles.topSegment}>
          <View style={{ position: 'absolute', zIndex: 1 }}>
            {backButton ? (
              <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} style={styles.backButton} />
            ) : null}
          </View>

          <View style={[{ flex: 1, alignItems: 'center' }]}>
            {title ? <Text style={styles.title}>{title}</Text> : <View />}
            {authLock || personLock ? (<UserHeader navigation={navigation} personLock={personLock} />) : null}
          </View>

          <View style={{ position: 'absolute' }} />
        </View>

        {visible ? (<View style={[styles.content, contentStyle]}>{children}</View>) : null}

        <View style={[{ width: '100%' }, footerPadding]}>
          {!bottomButtons ? (<Text style={{ textAlign: 'center' }}>Koningo</Text>) : null}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'scroll',
  },
  topSegment: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 0,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  backPlaceholder: {
    width: 72,
  },
  headerPlaceholder: {
    width: 72,
  },
  title: {
    fontSize: 28,
    alignItems: 'center',
    textAlign: 'center',
    width: '100%',
    marginHorizontal: 40,
  },
  content: {
    width: '100%',
    maxWidth: 1200,
    alignItems: 'stretch',
    paddingHorizontal: 16,
  },
  buttons: {
    width: '100%',
    maxWidth: 300,
  },
  buttonWrap: {
    marginVertical: 6,
  },
})