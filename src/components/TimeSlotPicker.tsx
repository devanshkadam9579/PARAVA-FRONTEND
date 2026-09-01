import React from 'react';
import { Sun, Moon, Clock, Calendar } from 'lucide-react';

export type TimeSlot = 'morning' | 'evening' | 'fullday';

interface TimeSlotPickerProps {
  selectedSlot: TimeSlot;
  onSelectSlot: (slot: TimeSlot) => void;
  selectedTime?: string;
  onTimeChange?: (time: string) => void;
}

export default function TimeSlotPicker({
  selectedSlot,
  onSelectSlot,
  selectedTime,
  onTimeChange
}: TimeSlotPickerProps) {
  const slots: { id: TimeSlot; title: string; timing: string; icon: any }[] = [
    {
      id: 'morning',
      title: 'Morning Slot',
      timing: '09:00 AM – 02:00 PM',
      icon: Sun
    },
    {
      id: 'evening',
      title: 'Evening Slot',
      timing: '05:00 PM – 11:00 PM',
      icon: Moon
    },
    {
      id: 'fullday',
      title: 'Full Day Event',
      timing: '09:00 AM – 11:00 PM',
      icon: Clock
    }
  ];

  return (
    <div className="space-y-2.5 bg-gray-50/80 p-3.5 rounded-2xl border border-brand-border">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
          <Calendar size={12} className="text-brand-primary" />
          <span>Event Time Slot *</span>
        </label>
        <span className="text-[10px] text-brand-primary font-bold uppercase">
          {selectedSlot === 'morning' ? '🌅 Morning' : selectedSlot === 'evening' ? '🌆 Evening' : '☀️ Full Day'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const Icon = slot.icon;
          const isSelected = selectedSlot === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSelectSlot(slot.id)}
              className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 flex flex-col justify-between min-h-[68px] ${
                isSelected
                  ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon size={14} className={isSelected ? 'text-white' : 'text-brand-primary'} />
                {isSelected && <span className="text-[9px] font-black">✓</span>}
              </div>
              <div>
                <span className="font-extrabold text-[11px] block leading-tight">{slot.title}</span>
                <span className={`text-[9px] block leading-tight mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                  {slot.timing}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
