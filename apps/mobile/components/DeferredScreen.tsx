import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { UyirinaiTheme } from '../constants/theme';

export function DeferredScreen({ title, onBack }: { title: string; onBack?: () => void }) {
  return <View style={{ flex: 1, padding: 20, gap: 12, backgroundColor: UyirinaiTheme.colors.lightGrey }}>
    {onBack && <TouchableOpacity onPress={onBack}><Text>‹ More</Text></TouchableOpacity>}
    <Text style={{ fontSize: 22, fontWeight: '800' }}>{title}</Text>
    <Text>This management screen is scheduled for a later phase.</Text>
  </View>;
}

