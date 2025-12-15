import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOODS } from '../constants/moods';

export default function HomeScreen ({ todayMood, todayNote, onLogMood, onSaveNote }) {
  const [greeting, setGreeting] = useState('');
  const [dateText, setDateText] = useState('');

  useEffect(() => {
    const hours = new Date().getHours();
    let greet = "早上好";
    if (hours >= 11 && hours < 13) greet = "中午好";
    else if (hours >= 13 && hours < 18) greet = "下午好";
    else if (hours >= 18) greet = "晚上好";
    setGreeting(greet);

    const now = new Date();
    const dateStr = `${now.getMonth() + 1}月${now.getDate()}日，周${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`;
    setDateText(dateStr);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollPage} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingTitle}>{greeting}</Text>
              <Text style={styles.dateText}>{dateText}</Text>
            </View>
            <TouchableOpacity style={styles.bellButton} onPress={() => {/* notification logic moved or kept? passed as prop if needed */ }}>
              <Ionicons name="notifications-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.moodList}>
          {MOODS.map(mood => {
            const isSelected = todayMood === mood.id;
            return (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodButton,
                  isSelected && { borderColor: mood.color, backgroundColor: mood.bg }
                ]}
                onPress={() => onLogMood(mood.id)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  isSelected && { color: '#1F2937', fontWeight: 'bold' }
                ]}>{mood.label}</Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={mood.color} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>写点什么...</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="今天发生了什么？"
            placeholderTextColor="#9CA3AF"
            multiline
            value={todayNote}
            onChangeText={onSaveNote}
          />
        </View>

        {todayMood && (
          <View style={styles.successTip}>
            <Text style={styles.successText}>已记录今天的状态 ✨</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollPage: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 30, marginTop: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bellButton: { padding: 8, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  greetingTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  dateText: { fontSize: 14, color: '#6B7280' },
  moodList: { width: '100%', gap: 16 },
  moodButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  moodEmoji: { fontSize: 32, marginRight: 16 },
  moodLabel: { fontSize: 18, color: '#4B5563', fontWeight: '500', flex: 1 },
  checkIcon: { marginLeft: 'auto' },
  noteContainer: { marginTop: 30, width: '100%' },
  noteLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  noteInput: { backgroundColor: 'white', borderRadius: 16, padding: 16, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E5E7EB', fontSize: 16, color: '#1F2937' },
  successTip: { marginTop: 12, alignItems: 'center' },
  successText: { color: '#059669', fontWeight: '600', fontSize: 12 },
});
