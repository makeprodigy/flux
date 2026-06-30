'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  hasError?: boolean;
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Select', hasError = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 py-2.5 text-[13px] font-semibold outline-none cursor-pointer transition-all duration-200 ${
          hasError ? 'border-2 border-red-500' : 'border border-transparent'
        } ${isOpen ? 'shadow-[0_4px_16px_rgba(109,40,217,0.12)] border-[#EDE9FE]' : ''} ${selectedOption ? 'text-[#352B25]' : 'text-[#A3A3A3]'}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={16} 
          strokeWidth={2.5}
          className={`text-[#352B25] transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full z-[100] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#E5E5E5] py-2 max-h-[260px] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold text-left transition-colors cursor-pointer border-none ${
                value === option.value
                  ? 'bg-[#F5F3FF] text-[#6D28D9]'
                  : 'bg-transparent text-[#352B25] hover:bg-[#F5F5F5]'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && <Check size={14} strokeWidth={3} className="text-[#6D28D9] shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
