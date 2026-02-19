import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type Props = {
  trackName?: string | null
  vehicleName?: string | null
  scale?: string | number | null
  bestLapMs?: number | null
  lapsCount?: number | null
  sessionTimeMs?: number | null
}

export default function SessionChip({ trackName, vehicleName, scale, bestLapMs, lapsCount, sessionTimeMs }: Props) {
  const fmt = (ms?: number | null) => {
    if (ms == null) return '—'
    const s = Math.floor(Number(ms) / 1000)
    const mm = Math.floor(s / 60)
    const ss = s % 60
    const cs = Math.floor((Number(ms) % 1000) / 10)
    return `${mm}:${String(ss).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
  }

  return (
    <View style={styles.chip}>
      <View style={styles.row}>
        <Text style={styles.track}>{trackName ?? '—'}</Text>
        <Text style={styles.sep}>—</Text>
        <Text style={styles.vehicle}>{vehicleName ?? '—'}</Text>
      </View>
      <View style={styles.rowSmall}>
        <Text style={styles.small}>Escala: {scale ?? '—'}</Text>
        <Text style={styles.small}>Vueltas: {lapsCount ?? '—'}</Text>
        <Text style={styles.small}>Mejor: {fmt(bestLapMs)}</Text>
        <Text style={styles.small}>Tiempo: {fmt(sessionTimeMs)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: { width: '100%', padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rowSmall: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap' },
  track: { fontWeight: '700', fontSize: 14 },
  vehicle: { fontWeight: '600', fontSize: 13 },
  sep: { marginHorizontal: 8, color: '#666' },
  small: { fontSize: 12, color: '#444', marginRight: 8 }
})
