'use client';

import { useId } from 'react';
import type { HTMLInputTypeAttribute } from 'react';
import { Input as ShadcnInput } from '@/components/shadcn/input';
import { Select as ShadcnSelect } from '@/components/shadcn/select';

interface InputProps {
  label?: string;
  name?: string;
  type?: HTMLInputTypeAttribute;
  min?: number;
  max?: number;
  maxLength?: number;
  step?: number | string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export default function Input({
  label,
  name,
  type = 'text',
  min,
  max,
  maxLength,
  step,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  className = '',
}: InputProps) {
  const generatedId = useId();
  const inputId = name || generatedId;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium leading-none">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <ShadcnInput
        id={inputId}
        name={name}
        type={type}
        min={min}
        max={max}
        maxLength={maxLength}
        step={step}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && <p id={`${inputId}-error`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface SelectProps {
  label?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function Select({
  label,
  name,
  value,
  onChange,
  options,
  required,
  disabled,
  error,
  placeholder,
  className = '',
}: SelectProps) {
  const generatedId = useId();
  const selectId = name || generatedId;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium leading-none">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <ShadcnSelect
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </ShadcnSelect>
      {error && <p id={`${selectId}-error`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
