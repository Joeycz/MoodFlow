import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { MOODS } from '../constants/moods';
import SegmentedControl from '../components/SegmentedControl';

export default function CalendarScreen ({ logs, onDayPress }) {
  const [calendarViewMode, setCalendarViewMode] = useState('month'); // default to year
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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
    return marks;
  }, [logs]);

  const moodStats = useMemo(() => {
    const stats = { total: 0, counts: {} };
    Object.values(logs).forEach(log => {
      stats.total++;
      stats.counts[log.moodId] = (stats.counts[log.moodId] || 0) + 1;
    });
    return stats;
  }, [logs]);

  // Yearly Calendar Logic
  const renderYearlyCalendar = () => {
    const days = [];
    const date = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    // Helper to format date using local time
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (date <= endDate) {
      const dateStr = formatDate(date);
      const isFuture = date > today;

      const log = logs[dateStr];
      const isMonthStart = date.getDate() === 1;

      days.push({
        date: dateStr,
        moodId: log ? log.moodId : null,
        isFuture,
        isToday: dateStr === formatDate(today),
        isMonthStart,
        monthDisplay: isMonthStart ? (date.getMonth() + 1) : null
      });
      date.setDate(date.getDate() + 1);
    }

    // Chunk days
    const COLUMNS = 20;
    const rows = [];
    for (let i = 0; i < days.length; i += COLUMNS) {
      const chunk = days.slice(i, i + COLUMNS);
      while (chunk.length < COLUMNS) {
        chunk.push(null);
      }
      rows.push(chunk);
    }

    return (
      <View style={styles.yearContainer}>
        <View style={styles.yearHeaderRow}>
          <TouchableOpacity onPress={() => setCurrentYear(currentYear - 1)} style={styles.yearArrowBtn}>
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.yearTitle}>{currentYear}</Text>
          <TouchableOpacity onPress={() => setCurrentYear(currentYear + 1)} disabled={currentYear >= new Date().getFullYear()} style={styles.yearArrowBtn}>
            <Ionicons name="chevron-forward" size={20} color={currentYear >= new Date().getFullYear() ? "#E5E7EB" : "#6B7280"} />
          </TouchableOpacity>
        </View>

        <View style={styles.streamGridWrapper}>
          {rows.map((row, rIndex) => {
            const monthStartDay = row.find(d => d && d.isMonthStart);
            const monthLabel = monthStartDay ? monthStartDay.monthDisplay + '月' : '';

            return (
              <View key={rIndex} style={styles.streamRow}>
                <View style={styles.rowLabelColumn}>
                  <Text style={styles.rowLabelText}>{monthLabel}</Text>
                </View>
                <View style={styles.rowCells}>
                  {row.map((day, dIndex) => {
                    if (!day) return <View key={`placeholder-${dIndex}`} style={[styles.streamCell, { backgroundColor: 'transparent' }]} />;

                    const mood = day.moodId ? MOODS.find(m => m.id === day.moodId) : null;
                    let backgroundColor = '#F3F4F6';
                    if (mood && !day.isFuture) backgroundColor = mood.color;

                    return (
                      <TouchableOpacity
                        key={day.date}
                        style={[
                          styles.streamCell,
                          { backgroundColor },
                          day.isToday && { borderWidth: 1, borderColor: '#111827' }
                        ]}
                        onPress={() => !day.isFuture && onDayPress({ dateString: day.date })}
                        disabled={day.isFuture}
                      />
                    );
                  })}
                </View>
              </View>
            )
          })}
        </View>

        <View style={styles.heatmapLegend}>
          {MOODS.map(m => (
            <View key={m.id} style={styles.legendItem}>
              <View style={[styles.heatmapCellMini, { backgroundColor: m.color }]} />
              <Text style={styles.legendText}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.calendarHeader}>
        <Text style={styles.pageTitle}>情绪足迹</Text>
        <View style={styles.viewToggle}>
          <SegmentedControl
            values={[{ label: '月', value: 'month' }, { label: '年', value: 'year' }]}
            selectedValue={calendarViewMode}
            onChange={setCalendarViewMode}
          />
        </View>
      </View>

      {calendarViewMode === 'month' ? (
        <View style={styles.calendarWrapper}>
          <Calendar
            maxDate={new Date().toISOString().split('T')[0]}
            onDayPress={onDayPress}
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
      ) : renderYearlyCalendar()}

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>{calendarViewMode === 'month' ? '本月记录' : '年度统计'}</Text>
        <View style={styles.statsGrid}>
          <Text style={styles.totalCount}>{moodStats.total} <Text style={styles.totalLabel}>天</Text></Text>
          <View style={styles.distributionContainer}>
            <View style={styles.distributionBar}>
              {MOODS.map(mood => {
                const count = moodStats.counts[mood.id] || 0;
                if (count === 0) return null;
                const flex = count / moodStats.total;
                return <View key={mood.id} style={{ flex, backgroundColor: mood.color }} />;
              })}
            </View>
            <View style={styles.legendContainer}>
              {MOODS.map(mood => {
                const count = moodStats.counts[mood.id] || 0;
                if (count === 0) return null;
                return (
                  <Text key={mood.id} style={styles.legendText}>
                    {mood.emoji} {count}
                  </Text>
                )
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: { flex: 1, padding: 24 }, // Removed justifyContent: 'center'
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  viewToggle: { borderRadius: 8 },

  calendarWrapper: { backgroundColor: 'white', borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },

  // Year View Styles
  yearContainer: { backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 10 },
  yearHeaderRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, gap: 16 },
  yearTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  yearArrowBtn: { padding: 4 },

  streamGridWrapper: { flexDirection: 'column', gap: 2 },
  streamRow: { flexDirection: 'row', alignItems: 'center' },
  rowLabelColumn: { width: 30, alignItems: 'flex-end', paddingRight: 6 },
  rowLabelText: { fontSize: 10, fontWeight: 'bold', color: '#111827' },
  rowCells: { flexDirection: 'row', gap: 2, flex: 1 },
  streamCell: { flex: 1, aspectRatio: 1, borderRadius: 2 },
  heatmapCellMini: { width: 8, height: 8, borderRadius: 2, marginRight: 4 },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendText: { fontSize: 10, color: '#4B5563' }, // used by both legend and stats

  // Stats
  statsContainer: { marginTop: 24, padding: 16, backgroundColor: 'white', borderRadius: 12, alignItems: 'center' },
  statsTitle: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  totalCount: { fontSize: 32, fontWeight: 'bold', color: '#111827' },
  totalLabel: { fontSize: 14, fontWeight: 'normal' },
  distributionContainer: { width: '100%', marginTop: 16, alignItems: 'center' },
  distributionBar: { flexDirection: 'row', width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, gap: 12 },
});
