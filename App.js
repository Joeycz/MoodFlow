import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar, Alert, TextInput, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';

// --- 1. 配置区域 ---

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

// 震动控制中心
const triggerHaptic = (style = 'medium') => {
  if (Platform.OS === 'ios') {
    if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    // Android 策略：只使用最轻微的 selection 震动
    Haptics.selectionAsync(); 
  }
};

// 心情数据配置 (含专属语录和渐变色)
const MOODS = [
  { 
    id: 'rad', 
    label: '超棒', 
    emoji: '🤩', 
    color: '#FACC15', 
    bg: '#FEF9C3', 
    quote: "生活明朗，万物可爱 ✨", 
    gradient: ['#FBBF24', '#B45309'] 
  }, 
  { 
    id: 'good', 
    label: '开心', 
    emoji: '😊', 
    color: '#4ADE80', 
    bg: '#DCFCE7', 
    quote: "保持热爱，奔赴山海 🌊",
    gradient: ['#34D399', '#047857'] 
  }, 
  { 
    id: 'meh', 
    label: '一般', 
    emoji: '😐', 
    color: '#60A5FA', 
    bg: '#DBEAFE', 
    quote: "平平淡淡才是真 ☕",
    gradient: ['#60A5FA', '#1D4ED8'] 
  }, 
  { 
    id: 'sad', 
    label: '难过', 
    emoji: '😔', 
    color: '#818CF8', 
    bg: '#E0E7FF', 
    quote: "抱抱自己，明天会更好 🌙",
    gradient: ['#818CF8', '#4338CA'] 
  }, 
  { 
    id: 'awful', 
    label: '糟糕', 
    emoji: '😫', 
    color: '#9CA3AF', 
    bg: '#F3F4F6', 
    quote: "允许自己偶尔的不完美 🍃",
    gradient: ['#9CA3AF', '#374151'] 
  }, 
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [logs, setLogs] = useState({}); 
  const [todayMood, setTodayMood] = useState(null);
  const [todayNote, setTodayNote] = useState('');
  const [bottomPadding, setBottomPadding] = useState(120);
  
  // 弹窗相关状态
  const [modalVisible, setModalVisible] = useState(false);
  const [selectDay, setSelectDay] = useState('');
  const [modalMood, setModalMood] = useState(null);
  const [modalNote, setModalNote] = useState('');

  const cardRef = useRef();
  const scrollViewRef = useRef();

  // --- 2. 生命周期与数据逻辑 ---

  useEffect(() => {
    loadData();
    // 监听键盘事件，动态调整底部 Padding
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setBottomPadding(300)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setBottomPadding(120)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const loadData = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem('moodLogs');
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        setLogs(parsed);
        const todayKey = new Date().toISOString().split('T')[0];
        if (parsed[todayKey]) {
          setTodayMood(parsed[todayKey].moodId);
          setTodayNote(parsed[todayKey].note || '');
        }
      }
    } catch (e) {
      console.error("读取数据失败", e);
    }
  };

  const handleSaveMood = async (moodId) => {
    triggerHaptic('medium');
    const todayKey = new Date().toISOString().split('T')[0];
    const newEntry = { moodId, note: todayNote, timestamp: Date.now() };
    const newLogs = { ...logs, [todayKey]: newEntry };
    setLogs(newLogs);
    setTodayMood(moodId);
    saveToStorage(newLogs);
  };

  const handleSaveNote = (text) => {
    setTodayNote(text);
    if (todayMood) {
      const todayKey = new Date().toISOString().split('T')[0];
      const newEntry = { moodId: todayMood, note: text, timestamp: Date.now() };
      const newLogs = { ...logs, [todayKey]: newEntry };
      setLogs(newLogs);
      saveToStorage(newLogs);
    }
  };

  const saveToStorage = async (newLogs) => {
    try {
      await AsyncStorage.setItem('moodLogs', JSON.stringify(newLogs));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteLog = async (dateKey) => {
    try {
      const newLogs = { ...logs };
      delete newLogs[dateKey]; 
      setLogs(newLogs);
      await AsyncStorage.setItem('moodLogs', JSON.stringify(newLogs));
      
      const todayKey = new Date().toISOString().split('T')[0];
      if (dateKey === todayKey) {
        setTodayMood(null);
        setTodayNote('');
      }
      
      triggerHaptic('success');
      setModalVisible(false); // 关闭弹窗
    } catch (e) {
      Alert.alert("错误", "删除失败");
    }
  };

  // 打开弹窗逻辑
  const handleDayPress = (day) => {
    setSelectDay(day.dateString);
    const log = logs[day.dateString];
    
    if (log) {
      setModalMood(log.moodId);
      setModalNote(log.note || '');
    } else {
      setModalMood(null);
      setModalNote('');
    }
    setModalVisible(true);
    triggerHaptic('light');
  };

  // 弹窗保存逻辑
  const saveFromModal = () => {
    if (!modalMood) {
      Alert.alert("提示", "请选择一个心情");
      return;
    }
    
    const newEntry = { moodId: modalMood, note: modalNote, timestamp: Date.now() };
    const newLogs = { ...logs, [selectDay]: newEntry };
    setLogs(newLogs);
    saveToStorage(newLogs);
    
    // 如果修改的是今天，同步更新首页状态
    const todayKey = new Date().toISOString().split('T')[0];
    if (selectDay === todayKey) {
      setTodayMood(modalMood);
      setTodayNote(modalNote);
    }
    
    setModalVisible(false);
    triggerHaptic('success');
  };

  const handleShare = async () => {
    try {
      triggerHaptic('success');
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("抱歉", "生成分享图片失败了");
    }
  };

  const scheduleNotification = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('权限未开启', '请在手机设置中开启通知权限。');
        return;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: { title: "MoodFlow", body: "今天过得怎么样？花一分钟记录一下心情吧 📝", sound: true },
        trigger: { hour: 20, minute: 0, repeats: true },
      });
      triggerHaptic('success');
      Alert.alert("设置成功", "每日 20:00 会提醒你记录心情 🌱");
    } catch (e) {
      Alert.alert("错误", "设置提醒失败");
    }
  };

  const moodStats = useMemo(() => {
    const stats = { total: 0, counts: {} };
    Object.values(logs).forEach(log => {
      stats.total++;
      stats.counts[log.moodId] = (stats.counts[log.moodId] || 0) + 1;
    });
    return stats;
  }, [logs]);

  const markedDates = useMemo(() => {
    const marks = {};
    Object.keys(logs).forEach(date => {
      const moodId = logs[date].moodId;
      const mood = MOODS.find(m => m.id === moodId);
      if (mood) {
        marks[date] = {
          customStyles: {
            container: { backgroundColor: mood.color, borderRadius: 8 },
            text: { color: 'white', fontWeight: 'bold' }
          }
        };
      }
    });
    // 选中当前点击的日期
    if (selectDay) {
      marks[selectDay] = {
        ...marks[selectDay],
        selected: true,
        selectedColor: '#E5E7EB',
        selectedTextColor: '#111827'
      }
    }
    return marks;
  }, [logs, selectDay]);

  const shareText = useMemo(() => {
    if (todayNote) return `"${todayNote}"`;
    if (todayMood) {
      const mood = MOODS.find(m => m.id === todayMood);
      return mood ? mood.quote : "这个月，我诚实地面对了自己。";
    }
    return "这个月，我诚实地面对了自己。";
  }, [todayNote, todayMood]);

  const getShareGradient = () => {
    if (todayMood) {
      const mood = MOODS.find(m => m.id === todayMood);
      return mood ? mood.gradient : ['#6366f1', '#a855f7'];
    }
    return ['#6366f1', '#a855f7'];
  };

  // --- 3. 界面渲染 ---

  const renderHome = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0} 
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollPage, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greetingTitle}>Hi, 今天过得怎么样？</Text>
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                </Text>
              </View>
              <TouchableOpacity style={styles.bellButton} onPress={scheduleNotification}>
                <Ionicons name="notifications-outline" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.moodList}>
            {MOODS.map((mood) => {
              const isActive = todayMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodButton,
                    isActive && { borderColor: mood.color, backgroundColor: mood.bg, borderWidth: 2 }
                  ]}
                  onPress={() => handleSaveMood(mood.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.moodEmoji, isActive && { transform: [{ scale: 1.2 }] }]}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, isActive && { color: '#1F2937', fontWeight: 'bold' }]}>{mood.label}</Text>
                  {isActive && <Ionicons name="checkmark-circle" size={24} color={mood.color} style={styles.checkIcon} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {todayMood && (
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>写点什么...</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="今天发生了什么特别的事？"
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={100}
                value={todayNote}
                onChangeText={handleSaveNote}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
              />
              <View style={styles.successTip}>
                <Text style={styles.successText}>已保存 🌱</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  const renderCalendar = () => (
    <View style={styles.pageContainer}>
      <Text style={styles.pageTitle}>情绪足迹</Text>
      <View style={styles.calendarWrapper}>
        <Calendar
          // 限制最大日期为今天，禁止选择未来
          maxDate={new Date().toISOString().split('T')[0]}
          onDayPress={handleDayPress}
          markingType={'custom'}
          markedDates={markedDates}
          theme={{
            todayTextColor: '#F59E0B',
            arrowColor: '#3B82F6',
            monthTextColor: '#111827',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600'
          }}
        />
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>本月记录</Text>
        <View style={styles.statsGrid}>
           <Text style={styles.totalCount}>{Object.keys(logs).length} <Text style={styles.totalLabel}>天</Text></Text>
           <View style={styles.distributionContainer}>
             <View style={styles.distributionBar}>
               {MOODS.map(mood => {
                 const count = moodStats.counts[mood.id] || 0;
                 if (count === 0 || moodStats.total === 0) return null;
                 const width = (count / moodStats.total) * 100;
                 return (
                   <View key={mood.id} style={{ width: `${width}%`, height: '100%', backgroundColor: mood.color }} />
                 );
               })}
             </View>
             <View style={styles.legendContainer}>
               {MOODS.map(mood => {
                 const count = moodStats.counts[mood.id] || 0;
                 if (count === 0) return null;
                 return (
                   <Text key={mood.id} style={styles.legendText}>{mood.emoji} {count}</Text>
                 )
               })}
             </View>
           </View>
        </View>
      </View>

      {/* 详情编辑弹窗 - 修复键盘遮挡 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          >
            {/* 阻止点击内容区域关闭弹窗 */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectDay}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubLabel}>心情</Text>
                <View style={styles.modalMoodRow}>
                  {MOODS.map(m => (
                    <TouchableOpacity 
                      key={m.id} 
                      onPress={() => setModalMood(m.id)}
                      style={[
                        styles.modalMoodItem, 
                        modalMood === m.id && { backgroundColor: m.bg, borderColor: m.color, borderWidth: 2 }
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
                  value={modalNote}
                  onChangeText={setModalNote}
                />

                <View style={styles.modalFooter}>
                  {/* 只有当记录存在时才显示删除按钮 */}
                  {logs[selectDay] ? (
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteLog(selectDay)}>
                      <Text style={styles.deleteButtonText}>删除</Text>
                    </TouchableOpacity>
                  ) : <View />} 
                  
                  <TouchableOpacity style={styles.saveButton} onPress={saveFromModal}>
                    <Text style={styles.saveButtonText}>保存记录</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );

  const renderShare = () => (
    <ScrollView contentContainerStyle={styles.scrollPage}>
      <Text style={styles.pageTitle}>分享卡片</Text>
      <View style={styles.cardContainer} ref={cardRef} collapsable={false}>
        <LinearGradient
          colors={getShareGradient()}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.appName}>MOODFLOW</Text>
            <View style={styles.cardIcon}>
              <Ionicons name="sunny" size={20} color="#FDE047" />
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={styles.cardMainText} numberOfLines={3}>
              {shareText}
            </Text>
          </View>
          <View style={styles.cardStatsRow}>
            <Text style={styles.cardStatText}>✨ 已记录 {Object.keys(logs).length} 天</Text>
            <Text style={styles.cardStatText}>📅 {new Date().toLocaleDateString()}</Text>
          </View>
          <View style={styles.dotsRow}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={[styles.dot, i < 3 ? { backgroundColor: 'rgba(255,255,255,0.6)' } : {}]} />
            ))}
          </View>
          <View style={styles.cardFooter}>
             <Text style={styles.cardFooterText}>Generated by MoodFlow App</Text>
          </View>
        </LinearGradient>
      </View>
      <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={20} color="white" />
        <Text style={styles.actionButtonText}>分享给朋友</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'share' && renderShare()}
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Ionicons name={activeTab === 'home' ? "add-circle" : "add-circle-outline"} size={28} color={activeTab === 'home' ? "#111827" : "#9CA3AF"} />
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>打卡</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('calendar')}>
          <Ionicons name={activeTab === 'calendar' ? "calendar" : "calendar-outline"} size={26} color={activeTab === 'calendar' ? "#111827" : "#9CA3AF"} />
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>足迹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('share')}>
          <Ionicons name={activeTab === 'share' ? "share-social" : "share-social-outline"} size={26} color={activeTab === 'share' ? "#111827" : "#9CA3AF"} />
          <Text style={[styles.tabText, activeTab === 'share' && styles.activeTabText]}>分享</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  content: { flex: 1 },
  pageContainer: { flex: 1, padding: 24, justifyContent: 'center' },
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
  pageTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111827', textAlign: 'center' },
  calendarWrapper: { backgroundColor: 'white', borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statsContainer: { marginTop: 24, padding: 16, backgroundColor: 'white', borderRadius: 12, alignItems: 'center' },
  statsTitle: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  totalCount: { fontSize: 32, fontWeight: 'bold', color: '#111827' },
  totalLabel: { fontSize: 14, fontWeight: 'normal' },
  keepGoing: { marginTop: 8, fontSize: 12, color: '#9CA3AF' },
  distributionContainer: { width: '100%', marginTop: 16, alignItems: 'center' },
  distributionBar: { flexDirection: 'row', width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, gap: 12 },
  legendText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  cardContainer: { width: '100%', aspectRatio: 0.8, marginBottom: 30, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  card: { flex: 1, borderRadius: 24, padding: 24, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  appName: { color: 'rgba(255,255,255,0.8)', fontSize: 12, letterSpacing: 1, fontWeight: '700' },
  cardIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 },
  cardMainText: { fontSize: 28, color: 'white', fontWeight: 'bold', lineHeight: 36 },
  cardStatsRow: { flexDirection: 'row', gap: 12 },
  cardStatText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 16 },
  cardFooterText: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  actionButton: { flexDirection: 'row', backgroundColor: '#111827', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center', gap: 8 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: Platform.OS === 'ios' ? 0 : 12, paddingTop: 12, height: Platform.OS === 'ios' ? 85 : 70 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 4 },
  tabText: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  activeTabText: { color: '#111827' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
