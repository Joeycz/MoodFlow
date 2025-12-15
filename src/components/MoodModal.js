import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Animated, Dimensions, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOODS } from '../constants/moods';

const MoodModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState({ date: '', moodId: null, note: '', hasLog: false });
  const [tempMood, setTempMood] = useState(null);
  const [tempNote, setTempNote] = useState('');

  const screenHeight = Dimensions.get('window').height;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useImperativeHandle(ref, () => ({
    show: ({ date, moodId, note, hasLog }) => {
      setData({ date, moodId, note, hasLog });
      setTempMood(moodId);
      setTempNote(note);
      setVisible(true);

      // Animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        })
      ]).start();
    },
    hide: () => closeModal()
  }));

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      })
    ]).start(() => setVisible(false));
  };

  const handleSave = () => {
    props.onSave({
      date: data.date,
      moodId: tempMood,
      note: tempNote
    });
    closeModal();
  };

  const handleDelete = () => {
    props.onDelete({ date: data.date });
    closeModal();
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{data.date}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubLabel}>心情</Text>
          <View style={styles.modalMoodRow}>
            {MOODS.map(m => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setTempMood(m.id)}
                style={[
                  styles.modalMoodItem,
                  tempMood === m.id && { backgroundColor: m.bg, borderColor: m.color, borderWidth: 2 }
                ]}
              >
                <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalSubLabel}>备注</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="补录一下当时的心情..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={100}
            value={tempNote}
            onChangeText={setTempNote}
          />

          <View style={styles.modalFooter}>
            {data.hasLog ? (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>删除</Text>
              </TouchableOpacity>
            ) : <View />}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>保存记录</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  modalSubLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 12 },
  modalMoodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  modalMoodItem: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  modalInput: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, height: 100, textAlignVertical: 'top', fontSize: 16, color: '#1F2937', marginBottom: 24 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteButton: { padding: 12 },
  deleteButtonText: { color: '#EF4444', fontWeight: '600' },
  saveButton: { backgroundColor: '#111827', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  saveButtonText: { color: 'white', fontWeight: 'bold' }
});

export default MoodModal;
