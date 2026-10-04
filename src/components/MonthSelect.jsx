import React, { useMemo } from 'react';
import { currentMonthKey, monthKey, monthLabel } from '../lib/format.js';

export default function MonthSelect({ expenses, value, onChange }) {
  const keys = useMemo(() => {
    const set = new Set(expenses.map((e) => monthKey(e.date)).filter(Boolean));
    set.add(currentMonthKey());
    return [...set].sort().reverse();
  }, [expenses]);
  return (
    <select className="month-filter" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">All months</option>
      {keys.map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
    </select>
  );
}
