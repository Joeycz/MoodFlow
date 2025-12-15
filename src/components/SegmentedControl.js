import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function SegmentedControl ({ values, selectedValue, onChange, activeColor = '#111827', inactiveColor = '#6B7280' }) {
  return (
    <View style={styles.container}>
      {values.map((value) => {
        const isActive = selectedValue === value.value;
        return (
          <TouchableOpacity
            key={value.value}
            style={[
              styles.btn,
              isActive && styles.activeBtn
            ]}
            onPress={() => onChange(value.value)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.text,
              { color: isActive ? activeColor : inactiveColor },
              isActive && styles.activeText
            ]}>
              {value.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 2,
  },
  btn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeBtn: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeText: {
    fontWeight: '600',
  },
});
