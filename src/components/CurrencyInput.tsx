import React, { useRef, useEffect, useState } from 'react';
import { formatThousand, cleanNumeric, terbilang } from '../utils/terbilang';
import { Sparkles, X } from 'lucide-react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  size?: 'normal' | 'lg';
  quickAmounts?: number[];
  showTerbilang?: boolean;
  min?: number;
  id?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  label = 'Nominal (Rp)',
  placeholder = '0',
  required = false,
  autoFocus = false,
  size = 'normal',
  quickAmounts,
  showTerbilang = true,
  min = 0,
  id
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState<string>(() => {
    return value && value > 0 ? formatThousand(value) : '';
  });

  // Sync internal display when external value changes
  useEffect(() => {
    const currentNumeric = cleanNumeric(displayValue);
    if (value !== currentNumeric) {
      setDisplayValue(value && value > 0 ? formatThousand(value) : '');
    }
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const inputElement = inputRef.current;
    
    // Store cursor position and length before formatting
    const prevCursor = inputElement?.selectionStart || 0;
    const prevLength = rawVal.length;

    // Remove non-digit characters
    const cleanNumber = cleanNumeric(rawVal);
    const newFormatted = cleanNumber > 0 ? formatThousand(cleanNumber) : '';

    setDisplayValue(newFormatted);
    onChange(cleanNumber);

    // Adjust cursor position to avoid jumping to the end
    setTimeout(() => {
      if (inputElement) {
        const lengthDiff = newFormatted.length - prevLength;
        const newCursorPos = Math.max(0, prevCursor + lengthDiff);
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleClear = () => {
    setDisplayValue('');
    onChange(0);
    inputRef.current?.focus();
  };

  const handleAddQuickAmount = (amount: number) => {
    const current = cleanNumeric(displayValue);
    const next = current + amount;
    setDisplayValue(formatThousand(next));
    onChange(next);
  };

  const numericValue = cleanNumeric(displayValue);
  const hasValue = numericValue > 0;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input wrapper with Rp badge and Clear button */}
      <div className="relative flex items-center">
        <span 
          className={`absolute left-4 font-bold text-slate-400 select-none pointer-events-none ${
            size === 'lg' ? 'text-lg' : 'text-sm'
          }`}
        >
          Rp
        </span>

        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          required={required}
          min={min}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          className={`w-full rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold tabular-nums outline-none transition-all focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white ${
            size === 'lg'
              ? 'pl-12 pr-10 py-3.5 text-xl tracking-tight'
              : 'pl-11 pr-9 py-2.5 text-sm'
          }`}
        />

        {/* Clear Button */}
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Hapus nominal"
            aria-label="Hapus nominal"
          >
            <X className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          </button>
        )}
      </div>

      {/* Quick Amount Chips */}
      {quickAmounts && quickAmounts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickAmounts.map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => handleAddQuickAmount(amt)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 tabular-nums transition active:scale-95 border border-slate-200/50 dark:border-slate-700/50"
            >
              +{formatThousand(amt)}
            </button>
          ))}
        </div>
      )}

      {/* Live Badge Terbilang */}
      {showTerbilang && (
        <div className="pt-0.5">
          {hasValue ? (
            <div className="flex items-start gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-tight">
                <strong>Terbilang:</strong> {terbilang(numericValue)}
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic px-1">
              ✨ Masukkan nominal (terbilang otomatis muncul di sini)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
