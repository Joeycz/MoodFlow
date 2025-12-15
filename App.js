import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { LocaleConfig } from 'react-native-calendars';

import { MOODS } from './src/constants/moods';
import MoodModal from './src/components/MoodModal';
import { triggerHaptic } from './src/utils/haptics';
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import ShareScreen from './src/screens/ShareScreen';

// --- Configuration ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

LocaleConfig.locales['zh'] = {
  monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
  today: "今天"
};
LocaleConfig.defaultLocale = 'zh';

function MoodFlowApp () {
  const [activeTab, setActiveTab] = useState('home');
  const [logs, setLogs] = useState({});
  const [todayMood, setTodayMood] = useState(null);
  const [todayNote, setTodayNote] = useState('');

  // Modal State
  const moodModalRef = useRef(null);

  const pagerRef = useRef(null);
  const TABS = ['home', 'calendar', 'share'];

  useEffect(() => {
    loadData();
    // scheduleNotification(); // Optional: kept if needed
  }, []);

  const loadData = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem('moodLogs');
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        setLogs(parsed);
        const todayKey = new Date().toISOString().split('T')[0]; // Use local date formatting if possible, but consistent key is vital
        // Actually for keys we should be careful. App logic used toISOString().split('T')[0] which is UTC.
        // But CalendarScreen logic uses local time formatter. 
        // IMPORTANT: We need CONSISTENCY. 
        // Original App.js used value of `new Date().toISOString().split('T')[0]` for keys.
        // This means keys are UTC-based (e.g. 2024-03-20).
        // If I change to local time formatting in CalendarScreen, I must match it here.
        // Let's use local time formatting everywhere for keys from now on to fix the timezone bug properly.
        // Re-implement getTodayKey helper.
      }
    } catch (e) {
      console.error("Load failed", e);
    }
  };

  const getTodayKey = () => {
    // Consistent local date key
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const saveToStorage = async (newLogs) => {
    try {
      await AsyncStorage.setItem('moodLogs', JSON.stringify(newLogs));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogMood = (moodId) => {
    triggerHaptic('medium');
    const todayKey = getTodayKey();
    const newEntry = { moodId, note: todayNote, timestamp: Date.now() };
    const newLogs = { ...logs, [todayKey]: newEntry };
    setLogs(newLogs);
    setTodayMood(moodId);
    saveToStorage(newLogs);
  };

  const handleSaveNote = (text) => {
    setTodayNote(text);
    if (todayMood) {
      const todayKey = getTodayKey();
      const newEntry = { moodId: todayMood, note: text, timestamp: Date.now() };
      const newLogs = { ...logs, [todayKey]: newEntry };
      setLogs(newLogs);
      saveToStorage(newLogs);
    }
  };

  const handleDayPress = (day) => {
    // day from react-native-calendars is object { dateString: '2024-03-20', ... }
    // Our custom grid also passes { dateString: ... }
    const todayKey = getTodayKey();
    if (day.dateString > todayKey) return; // Future date

    const log = logs[day.dateString];

    moodModalRef.current.show({
      date: day.dateString,
      moodId: log ? log.moodId : null,
      note: log ? log.note : '',
      hasLog: !!log
    });

    triggerHaptic('light');
  };

  const handleSaveFromModal = ({ date, moodId, note }) => {
    if (!moodId) {
      Alert.alert("提示", "请选择一个心情");
      return;
    }

    const newLogs = { ...logs, [date]: { moodId: moodId, note: note, timestamp: Date.now() } };
    setLogs(newLogs);
    saveToStorage(newLogs);

    const todayKey = getTodayKey();
    if (date === todayKey) {
      setTodayMood(moodId);
      setTodayNote(note);
    }
    triggerHaptic('success');
  };

  const handleDeleteLog = ({ date }) => {
    const newLogs = { ...logs };
    delete newLogs[date];
    setLogs(newLogs);
    saveToStorage(newLogs);

    const todayKey = getTodayKey();
    if (date === todayKey) {
      setTodayMood(null);
      setTodayNote('');
    }
    triggerHaptic('success');
  };

  const handleTabPress = (tab) => {
    const index = TABS.indexOf(tab);
    pagerRef.current?.setPage(index);
    setActiveTab(tab);
  };

  const handlePageSelected = (e) => {
    setActiveTab(TABS[e.nativeEvent.position]);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={handlePageSelected}
        >
          <View key="home" style={{ flex: 1 }}>
            <HomeScreen
              todayMood={todayMood}
              todayNote={todayNote}
              onLogMood={handleLogMood}
              onSaveNote={handleSaveNote}
            />
          </View>
          <View key="calendar" style={{ flex: 1 }}>
            <CalendarScreen
              logs={logs}
              onDayPress={handleDayPress}
            />
          </View>
          <View key="share" style={{ flex: 1 }}>
            <ShareScreen
              logs={logs}
              todayMood={todayMood}
              todayNote={todayNote}
            />
          </View>
        </PagerView>
      </View>

      <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom }]}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('home')}>
            <Ionicons name={activeTab === 'home' ? "add-circle" : "add-circle-outline"} size={28} color={activeTab === 'home' ? "#111827" : "#9CA3AF"} />
            <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>打卡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('calendar')}>
            <Ionicons name={activeTab === 'calendar' ? "calendar" : "calendar-outline"} size={26} color={activeTab === 'calendar' ? "#111827" : "#9CA3AF"} />
            <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>足迹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('share')}>
            <Ionicons name={activeTab === 'share' ? "share-social" : "share-social-outline"} size={26} color={activeTab === 'share' ? "#111827" : "#9CA3AF"} />
            <Text style={[styles.tabText, activeTab === 'share' && styles.activeTabText]}>分享</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MoodModal
        ref={moodModalRef}
        onSave={handleSaveFromModal}
        onDelete={handleDeleteLog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1 },
  // TabBar
  tabBarWrapper: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  tabBar: { flexDirection: 'row', paddingTop: 12, paddingBottom: 12 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 4 },
  tabText: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  activeTabText: { color: '#111827' },
});

export default function App () {
  return (
    <SafeAreaProvider>
      <MoodFlowApp />
    </SafeAreaProvider>
  );
}
