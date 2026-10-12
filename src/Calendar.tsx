import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Icon } from './components';
import { colors, radius, space } from './theme';

export type CalendarProps = {
  selectedDate?: string; // YYYY-MM-DD
  onSelectDate?: (date: string) => void;
  markedDates?: string[]; // YYYY-MM-DD strings to mark (birthdays)
};

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Hard-coded rather than taken from toLocaleString: the Hermes runtime does not
// always ship full Intl data, and a missing locale would render a bare number.
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// A fixed six-week grid, so the calendar keeps the same height as the user pages
// through months instead of jumping around.
const GRID_CELLS = 42;

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayIso(): string {
  const now = new Date();
  return isoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Month view with a day grid.
 *
 * Birthdays repeat every year, so marked dates are matched on month/day alone.
 * The month title opens a month + year picker, which matters when the calendar
 * is used to pick a birth date decades in the past.
 */
export function Calendar({ selectedDate, onSelectDate, markedDates = [] }: CalendarProps) {
  const [cursor, setCursor] = useState(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-');
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [jumping, setJumping] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = useMemo(todayIso, []);
  const markedMonthDays = useMemo(() => markedDates.map(d => d.slice(5)), [markedDates]);

  const cells = useMemo(() => {
    const leadingBlanks = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: GRID_CELLS }, (_, i) => {
      const day = i - leadingBlanks + 1;
      return day >= 1 && day <= daysInMonth ? isoDate(year, month, day) : null;
    });
  }, [year, month]);

  const goToToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setJumping(false);
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setCursor(new Date(year, month - 1, 1))}
          style={[styles.arrowBtn, styles.arrowPrev]}
          accessibilityLabel="Previous month"
          hitSlop={8}
        >
          <Icon name="chevron" size={20} color={colors.ink} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setJumping(v => !v)}
          style={styles.titleBtn}
          accessibilityLabel="Choose month and year"
        >
          <Text style={styles.monthName}>{`${MONTHS[month]} ${year}`}</Text>
          <Text style={styles.titleCaret}>{jumping ? '▴' : '▾'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCursor(new Date(year, month + 1, 1))}
          style={styles.arrowBtn}
          accessibilityLabel="Next month"
          hitSlop={8}
        >
          <Icon name="chevron" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {jumping && (
        <View style={styles.jumpPanel}>
          <View style={styles.yearRow}>
            <TouchableOpacity
              onPress={() => setCursor(new Date(year - 1, month, 1))}
              style={styles.yearBtn}
              accessibilityLabel="Previous year"
            >
              <Text style={styles.yearBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.yearText}>{year}</Text>
            <TouchableOpacity
              onPress={() => setCursor(new Date(year + 1, month, 1))}
              style={styles.yearBtn}
              accessibilityLabel="Next year"
            >
              <Text style={styles.yearBtnText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToToday}
              style={styles.todayBtn}
              accessibilityLabel="Go to today"
            >
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthGrid}>
            {MONTHS.map((name, i) => (
              <TouchableOpacity
                key={name}
                onPress={() => {
                  setCursor(new Date(year, i, 1));
                  setJumping(false);
                }}
                style={[styles.monthChip, i === month && styles.monthChipOn]}
                accessibilityLabel={name}
              >
                <Text style={[styles.monthChipText, i === month && styles.monthChipTextOn]}>
                  {name.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.daysHeader}>
        {DAYS_OF_WEEK.map((label, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((dateStr, i) => {
          if (!dateStr) {
            return <View key={`blank-${i}`} style={styles.cell} />;
          }

          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const isMarked = markedMonthDays.includes(dateStr.slice(5));

          return (
            <TouchableOpacity
              key={dateStr}
              style={styles.cell}
              onPress={() => onSelectDate?.(dateStr)}
              disabled={!onSelectDate}
              accessibilityLabel={dateStr}
              accessibilityState={{ selected: isSelected }}
            >
              <View
                style={[
                  styles.dayCircle,
                  isMarked && styles.markedDay,
                  isToday && styles.todayDay,
                  isSelected && styles.selectedDay,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.todayDayText,
                    isSelected && styles.selectedDayText,
                  ]}
                >
                  {parseInt(dateStr.slice(8), 10)}
                </Text>
              </View>
              {isMarked && <View style={[styles.dot, isSelected && styles.selectedDot]} />}
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
  arrowBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  arrowPrev: {
    transform: [{ rotate: '180deg' }],
  },
  titleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  monthName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  titleCaret: {
    fontSize: 12,
    color: colors.dim,
  },
  jumpPanel: {
    backgroundColor: colors.bg,
    borderRadius: radius.inset,
    padding: space.sm,
    marginBottom: space.md,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginBottom: space.sm,
  },
  yearBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  yearBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    minWidth: 52,
    textAlign: 'center',
  },
  todayBtn: {
    marginLeft: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.goldDark,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthChip: {
    width: '25%',
    paddingVertical: 7,
    alignItems: 'center',
  },
  monthChipOn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
  },
  monthChipText: {
    fontSize: 14,
    color: colors.ink2,
  },
  monthChipTextOn: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  daysHeader: {
    flexDirection: 'row',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dim,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // The weekday labels and the day cells share this width, so the two rows line
  // up exactly. They used to be sized differently and drifted apart.
  cell: {
    width: '14.28%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markedDay: {
    backgroundColor: colors.goldSoft,
  },
  todayDay: {
    borderWidth: 1.5,
    borderColor: colors.pink,
  },
  selectedDay: {
    backgroundColor: colors.pink,
  },
  dayText: {
    fontSize: 16,
    color: colors.ink,
  },
  todayDayText: {
    fontWeight: '700',
    color: colors.pink,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.pink,
    marginTop: 1,
  },
  selectedDot: {
    backgroundColor: colors.pink,
  },
});
