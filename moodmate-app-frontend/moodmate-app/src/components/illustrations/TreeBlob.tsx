import React from 'react';
import { View, StyleSheet } from 'react-native';
import { calm } from '@/theme/tokens';

/**
 * The wellness-tree canopy motif shared by "You're All Set" (profile-setup finish) and the
 * Wellness Tree screen — a cluster of overlapping circles (canopy) over a trunk, built from
 * plain Views since Figma exported it as a flattened raster with no reusable vector data.
 */
export function TreeBlob({ size = 200 }: { size?: number }) {
  const u = size / 200; // scale unit relative to the 200px design
  return (
    <View style={{ width: size, height: size }}>
      <View style={[s.trunk, { left: 84 * u, top: 128 * u, width: 16 * u, height: 80 * u, borderRadius: 8 * u }]} />
      <View style={[s.branch, { left: 62 * u, top: 122 * u, width: 8 * u, height: 46 * u, borderRadius: 4 * u }]} />
      <View style={[s.branch, { left: 116 * u, top: 128 * u, width: 8 * u, height: 40 * u, borderRadius: 4 * u }]} />

      <View style={[s.canopy, { left: 18 * u, top: 44 * u, width: 100 * u, height: 92 * u, backgroundColor: '#7FA98C' }]} />
      <View style={[s.canopy, { left: 90 * u, top: 30 * u, width: 108 * u, height: 100 * u, backgroundColor: calm.primary }]} />
      <View style={[s.canopy, { left: 46 * u, top: 68 * u, width: 88 * u, height: 80 * u, backgroundColor: calm.forestPanel }]} />
      <View style={[s.canopy, { left: 116 * u, top: 74 * u, width: 78 * u, height: 70 * u, backgroundColor: calm.mint }]} />
      <View style={[s.dot, { left: 62 * u, top: 68 * u, width: 20 * u, height: 20 * u, backgroundColor: calm.amber }]} />
      <View style={[s.dot, { left: 148 * u, top: 62 * u, width: 16 * u, height: 16 * u, backgroundColor: calm.dustyPink }]} />
    </View>
  );
}

const s = StyleSheet.create({
  trunk: { position: 'absolute', backgroundColor: calm.brown },
  branch: { position: 'absolute', backgroundColor: calm.brown },
  canopy: { position: 'absolute', borderRadius: 999 },
  dot: { position: 'absolute', borderRadius: 999 },
});
