import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

export interface DateRange {
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;   // YYYY-MM-DD
}

export interface CalendarRangeSelectProps {
  selectedRange?: DateRange;
  selectedDate?: string | null;
  onSelectRange?: (range: DateRange) => void;
  onSelectDate?: (date: string) => void;
  mode?: 'single' | 'range';
  busyDates?: string[]; // YYYY-MM-DD
  bookedDates?: string[]; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD, defaults to today
  maxDate?: string;
  onConflictDetected?: (conflictingDates: string[]) => void;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CalendarRangeSelect({
  selectedRange = { startDate: null, endDate: null },
  selectedDate = null,
  onSelectRange,
  onSelectDate,
  mode = 'range',
  busyDates = [],
  bookedDates = [],
  minDate,
  maxDate,
  onConflictDetected,
  className = ''
}: CalendarRangeSelectProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const effectiveMinDateStr = useMemo(() => {
    if (minDate) return minDate;
    return today.toISOString().split('T')[0];
  }, [minDate, today]);

  // Initial view year & month from selected date/range or today
  const initialDate = useMemo(() => {
    const targetStr = selectedRange.startDate || selectedDate || effectiveMinDateStr;
    if (targetStr) {
      const parts = targetStr.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2] || 1);
    }
    return new Date();
  }, [selectedRange.startDate, selectedDate, effectiveMinDateStr]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Helper to format Date to YYYY-MM-DD
  const formatDateStr = (year: number, month: number, day: number): string => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Trailing days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        dayNumber: prevDay,
        dateStr: formatDateStr(prevYear, prevMonth, prevDay),
        isCurrentMonth: false
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        dayNumber: d,
        dateStr: formatDateStr(currentYear, currentMonth, d),
        isCurrentMonth: true
      });
    }

    // Leading days for next month to complete grid (multiples of 7)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining && days.length < 42; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        dayNumber: d,
        dateStr: formatDateStr(nextYear, nextMonth, d),
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Helper to check date status
  const isDatePast = (dateStr: string) => {
    return dateStr < effectiveMinDateStr;
  };

  const isDateBooked = (dateStr: string) => {
    return bookedDates.includes(dateStr);
  };

  const isDateBusy = (dateStr: string) => {
    return busyDates.includes(dateStr) && !isDateBooked(dateStr);
  };

  const isDateDisabled = (dateStr: string) => {
    return isDatePast(dateStr) || isDateBooked(dateStr) || isDateBusy(dateStr);
  };

  // Helper to check range status
  const isDateRangeStart = (dateStr: string) => {
    return selectedRange.startDate === dateStr;
  };

  const isDateRangeEnd = (dateStr: string) => {
    return selectedRange.endDate === dateStr;
  };

  const isDateInRange = (dateStr: string) => {
    if (!selectedRange.startDate || !selectedRange.endDate) return false;
    return dateStr > selectedRange.startDate && dateStr < selectedRange.endDate;
  };

  const isDateSelectedSingle = (dateStr: string) => {
    return selectedDate === dateStr;
  };

  // Check all dates in a proposed range for conflicts
  const validateRangeDates = (start: string, end: string): { valid: boolean; conflicts: string[] } => {
    const conflicts: string[] = [];
    let cur = new Date(start);
    const endD = new Date(end);

    while (cur <= endD) {
      const dStr = cur.toISOString().split('T')[0];
      if (isDateBooked(dStr) || isDateBusy(dStr) || isDatePast(dStr)) {
        conflicts.push(dStr);
      }
      cur.setDate(cur.getDate() + 1);
    }

    return { valid: conflicts.length === 0, conflicts };
  };

  // Day click handler
  const handleDayClick = (dateStr: string) => {
    if (isDateDisabled(dateStr)) return;

    if (mode === 'single') {
      onSelectDate?.(dateStr);
      return;
    }

    // Range mode
    if (!selectedRange.startDate || (selectedRange.startDate && selectedRange.endDate)) {
      // Start a new range
      onSelectRange?.({ startDate: dateStr, endDate: null });
    } else {
      // Completing the range
      if (dateStr < selectedRange.startDate) {
        // Clicked an earlier date -> reset start to this date
        onSelectRange?.({ startDate: dateStr, endDate: null });
      } else if (dateStr === selectedRange.startDate) {
        // Same date selected -> single day event range
        onSelectRange?.({ startDate: dateStr, endDate: dateStr });
      } else {
        // Validate all dates between start and end
        const { valid, conflicts } = validateRangeDates(selectedRange.startDate, dateStr);
        if (!valid) {
          onConflictDetected?.(conflicts);
          // Don't complete the invalid range
          return;
        }
        onSelectRange?.({ startDate: selectedRange.startDate, endDate: dateStr });
      }
    }
  };

  const handleClear = () => {
    if (mode === 'single') {
      onSelectDate?.('');
    } else {
      onSelectRange?.({ startDate: null, endDate: null });
    }
  };

  return (
    <div className={`w-full bg-white rounded-3xl p-5 border border-gray-100 shadow-sm font-sans select-none ${className}`}>
      {/* Header Month Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            {mode === 'range' ? 'Select event date or multi-day range' : 'Select event celebration date'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition active:scale-95 cursor-pointer"
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition active:scale-95 cursor-pointer"
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 pt-4 pb-2 text-center text-[11px] font-black text-gray-400 uppercase tracking-wider">
        {DAYS_OF_WEEK.map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {calendarDays.map(({ dayNumber, dateStr, isCurrentMonth }, idx) => {
          const disabled = isDateDisabled(dateStr);
          const isBooked = isDateBooked(dateStr);
          const isBusy = isDateBusy(dateStr);
          const isPast = isDatePast(dateStr);
          const isStart = isDateRangeStart(dateStr);
          const isEnd = isDateRangeEnd(dateStr);
          const inRange = isDateInRange(dateStr);
          const isSingleSelected = isDateSelectedSingle(dateStr);

          // Range / selected highlight styling
          const isHighlighted = isStart || isEnd || isSingleSelected;

          return (
            <div
              key={`${dateStr}-${idx}`}
              className={`relative py-1 flex items-center justify-center ${
                inRange ? 'bg-rose-50 text-rose-900' : ''
              } ${isStart && selectedRange.endDate ? 'rounded-l-full bg-rose-50' : ''} ${
                isEnd && selectedRange.startDate ? 'rounded-r-full bg-rose-50' : ''
              }`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleDayClick(dateStr)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xs font-bold transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                  isHighlighted
                    ? 'bg-rose-600 text-white shadow-md scale-105 z-10'
                    : inRange
                    ? 'text-rose-900 font-extrabold hover:bg-rose-100'
                    : disabled
                    ? 'text-gray-300 cursor-not-allowed line-through opacity-60'
                    : isCurrentMonth
                    ? 'text-gray-800 hover:bg-gray-100 active:scale-95'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
                title={
                  isBooked
                    ? 'Booked by another customer'
                    : isBusy
                    ? 'Blocked / Unavailable'
                    : isPast
                    ? 'Date in past'
                    : `Available on ${dateStr}`
                }
              >
                <span>{dayNumber}</span>
                {isBooked && (
                  <span className="w-1 h-1 bg-red-400 rounded-full mt-0.5" />
                )}
                {isBusy && (
                  <span className="w-1 h-1 bg-amber-400 rounded-full mt-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend & Summary Footer */}
      <div className="pt-4 mt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span>Booked / Busy</span>
          </div>
        </div>

        {(selectedRange.startDate || selectedDate) && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-rose-600 transition cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Clear selection</span>
          </button>
        )}
      </div>
    </div>
  );
}
