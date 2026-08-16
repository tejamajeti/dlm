import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface NumericInputProps {
  label?: string;
  value: number | string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  allowNegative?: boolean;
  showSteppers?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder,
  prefix,
  suffix,
  icon,
  disabled = false,
  required = false,
  className = '',
  allowNegative = false,
  showSteppers = true,
}) => {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  const handleDecrement = () => {
    if (disabled) return;
    const nextVal = Math.max(allowNegative ? -Infinity : min, numValue - step);
    const formatted = Number.isInteger(step) ? String(nextVal) : nextVal.toFixed(4).replace(/\.?0+$/, '');
    onChange(formatted);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const nextVal = max !== undefined ? Math.min(max, numValue + step) : numValue + step;
    const formatted = Number.isInteger(step) ? String(nextVal) : nextVal.toFixed(4).replace(/\.?0+$/, '');
    onChange(formatted);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!allowNegative && parseFloat(val) < 0) {
      val = String(min);
    }
    onChange(val);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="block text-xs font-semibold text-slate-300 mb-1">{label}</label>}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3 text-slate-500 pointer-events-none z-10">{icon}</div>}
        {prefix && !icon && (
          <span className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none z-10">{prefix}</span>
        )}

        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={allowNegative ? undefined : min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-slate-900 border border-slate-700 rounded-xl py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono ${
            icon || prefix ? 'pl-8' : 'pl-3'
          } ${showSteppers ? 'pr-16' : suffix ? 'pr-10' : 'pr-3'} ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-800' : ''
          }`}
        />

        {suffix && (
          <span
            className={`absolute text-[11px] font-semibold text-slate-500 pointer-events-none z-10 ${
              showSteppers ? 'right-16' : 'right-3'
            }`}
          >
            {suffix}
          </span>
        )}

        {showSteppers && !disabled && (
          <div className="absolute right-1.5 flex items-center gap-0.5 p-0.5 bg-slate-800 border border-slate-700/80 rounded-lg z-10">
            <button
              type="button"
              onClick={handleDecrement}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition active:scale-95"
              title="Decrease"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleIncrement}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition active:scale-95"
              title="Increase"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
