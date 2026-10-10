import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, space } from './theme';
import { Icon } from './components';

export type CalendarProps = {
  selectedDate?: string; // YYYY-MM-DD
  onSelectDate?: (date: string) => void;
  markedDates?: string[]; // array of YYYY-MM-DD strings to indicate birthdays
};

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function Calendar({ selectedDate, onSelectDate, markedDates = [] }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-');
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    }
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const goPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const { days, blankDays } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return {
      blankDays: Array.from({ length: firstDay }),
      days: Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      }),
    };
  }, [currentMonth]);

  // Strip year from marked dates for repeating birthdays
  const markedMonthDays = useMemo(() => {
    return markedDates.map(md => md.slice(5)); // 'MM-DD'
  }, [markedDates]);

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <Text style={styles.monthName}>{monthName}</Text>
        <View style={styles.navArrows}>
          <TouchableOpacity onPress={goPrevMonth} style={styles.arrowBtn}>
            <Icon name="chevron" size={20} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={goNextMonth} style={[styles.arrowBtn, { transform: [{ rotate: '180deg' }] }]}>
            <Icon name="chevron" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.daysHeader}>
        {DAYS_OF_WEEK.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {blankDays.map((_, i) => (
          <View key={`blank-${i}`} style={styles.dayCell} />
        ))}
        {days.map((dateStr) => {
          const isSelected = dateStr === selectedDate;
          const [, m, d] = dateStr.split('-');
          const md = `${m}-${d}`;
          const isMarked = markedMonthDays.includes(md);

          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.dayCell, isSelected && styles.selectedDay]}
              onPress={() => onSelectDate?.(dateStr)}
              disabled={!onSelectDate}
            >
              <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                {parseInt(d, 10)}
              </Text>
              {isMarked && (
                <View style={[styles.dot, isSelected && styles.selectedDot]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  monthName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  navArrows: {
    flexDirection: 'row',
  },
  arrowBtn: {
    padding: space.xs,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: space.sm,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dim,
    width: 32,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%', // 100 / 7
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDay: {
    backgroundColor: colors.pink,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 17,
    color: colors.ink,
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.pink,
    marginTop: 2,
  },
  selectedDot: {
    backgroundColor: '#FFF',
  },
});
