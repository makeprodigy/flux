'use client';

import { useRef } from 'react';
import { QuestionTypeConfig } from '@/types';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True/False',
  'Fill in the Blanks',
];
import CustomSelect from '@/components/ui/CustomSelect';

const QUESTION_TYPE_OPTIONS = QUESTION_TYPES.map(t => ({ value: t, label: t }));

interface Props {
  config: QuestionTypeConfig;
  index: number;
  diagramFile?: File;
  onUpdate: (index: number, updates: Partial<QuestionTypeConfig>) => void;
  onRemove: (index: number) => void;
  onDiagramUpload?: (index: number, file: File) => void;
  onDiagramRemove?: (index: number) => void;
}

export default function QuestionTypeRow({ config, index, diagramFile, onUpdate, onRemove, onDiagramUpload, onDiagramRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <>
    <div className="bg-white md:bg-transparent rounded-[24px] md:rounded-none p-4 md:p-0 mb-4 md:mb-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)] md:shadow-none flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto] gap-3 md:gap-3 md:items-center">
      {/* Type dropdown */}
      <div className="flex justify-between items-center md:contents px-1 md:px-0 mb-1 md:mb-0">
        <div className="flex-1 w-full md:w-auto">
          <CustomSelect
            value={config.type}
            options={QUESTION_TYPE_OPTIONS}
            onChange={(val) => onUpdate(index, { type: val })}
          />
        </div>

        {/* Remove button (Mobile) */}
        <button
          onClick={() => onRemove(index)}
          className="md:hidden ml-2 bg-transparent border-none cursor-pointer text-[#352B25] flex items-center justify-center p-1 opacity-60"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Remove button (Desktop) */}
      <button
        onClick={() => onRemove(index)}
        className="hidden md:flex bg-transparent border-none cursor-pointer text-[#A3A3A3] items-center justify-center p-1.5 rounded transition-colors duration-200 hover:text-red-500 hover:bg-red-50"
      >
        <X size={18} strokeWidth={2} />
      </button>

      {/* Counters Row */}
      <div className="bg-[#F5F5F5] md:bg-transparent rounded-[16px] md:rounded-none p-3 sm:p-3.5 md:p-0 flex flex-row gap-2.5 sm:gap-4 md:contents">
        {/* Count control */}
        <div className="flex-1 flex flex-col items-center md:items-start md:flex-initial min-w-0">
          <label className="block md:hidden text-[11px] font-medium text-[#352B25] mb-2.5 text-center w-full truncate">No. of Questions</label>
          <div className="counter-control rounded-full w-full md:w-auto justify-between bg-white md:bg-white border-none h-9 sm:h-10 px-1 sm:px-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:shadow-[0_2px_8px_rgba(0,0,0,0.02)]" style={{ gap: '4px' }}>
            <button className="counter-btn shrink-0 w-6 h-6 text-[18px] sm:text-[20px] flex items-center justify-center text-[#A3A3A3] hover:text-[#352B25]" onClick={() => onUpdate(index, { count: Math.max(1, config.count - 1) })}>−</button>
            <input
              type="number"
              className="hide-spin-button w-6 sm:w-8 text-center border-none outline-none text-[13px] sm:text-[14px] bg-transparent text-[#352B25] font-semibold p-0 shrink"
              min="1"
              value={config.count === 0 ? '' : config.count}
              onChange={(e) => {
                if (e.target.value === '') {
                  onUpdate(index, { count: 0 });
                } else {
                  const parsed = parseInt(e.target.value);
                  if (!isNaN(parsed)) onUpdate(index, { count: parsed });
                }
              }}
              onBlur={() => {
                if (!config.count || config.count < 1) onUpdate(index, { count: 1 });
              }}
            />
            <button className="counter-btn shrink-0 w-6 h-6 text-[18px] sm:text-[20px] flex items-center justify-center text-[#A3A3A3] hover:text-[#352B25]" onClick={() => onUpdate(index, { count: config.count + 1 })}>+</button>
          </div>
        </div>

        {/* Marks control */}
        <div className="flex-1 flex flex-col items-center md:items-start md:flex-initial min-w-0">
          <label className="block md:hidden text-[11px] font-medium text-[#352B25] mb-2.5 text-center w-full truncate">Marks</label>
          <div className="counter-control rounded-full w-full md:w-auto justify-between bg-white md:bg-white border-none h-9 sm:h-10 px-1 sm:px-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:shadow-[0_2px_8px_rgba(0,0,0,0.02)]" style={{ gap: '4px' }}>
            <button className="counter-btn shrink-0 w-6 h-6 text-[18px] sm:text-[20px] flex items-center justify-center text-[#A3A3A3] hover:text-[#352B25]" onClick={() => onUpdate(index, { marks: Math.max(1, config.marks - 1) })}>−</button>
            <input
              type="number"
              className="hide-spin-button w-6 sm:w-8 text-center border-none outline-none text-[13px] sm:text-[14px] bg-transparent text-[#352B25] font-semibold p-0 shrink"
              min="1"
              value={config.marks === 0 ? '' : config.marks}
              onChange={(e) => {
                if (e.target.value === '') {
                  onUpdate(index, { marks: 0 });
                } else {
                  const parsed = parseInt(e.target.value);
                  if (!isNaN(parsed)) onUpdate(index, { marks: parsed });
                }
              }}
              onBlur={() => {
                if (!config.marks || config.marks < 1) onUpdate(index, { marks: 1 });
              }}
            />
            <button className="counter-btn shrink-0 w-6 h-6 text-[18px] sm:text-[20px] flex items-center justify-center text-[#A3A3A3] hover:text-[#352B25]" onClick={() => onUpdate(index, { marks: config.marks + 1 })}>+</button>
          </div>
        </div>
      </div>
    </div>
    {config.type === 'Diagram/Graph-Based Questions' && (
      <div className="mt-2 py-2 px-3 bg-[#FAFAFA] rounded-md border border-[var(--color-border-light)] flex items-center justify-between">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0] && onDiagramUpload) {
              onDiagramUpload(index, e.target.files[0]);
            }
          }}
        />
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-[var(--color-text-muted)]" />
          <span className="text-xs text-[var(--color-text-secondary)] font-inter">
            {diagramFile ? diagramFile.name : 'Upload diagram image for this question (optional)'}
          </span>
        </div>
        <div className="flex gap-2">
          {diagramFile && (
            <button 
              onClick={() => onDiagramRemove && onDiagramRemove(index)}
              className="bg-transparent border-none text-[11px] text-red-500 cursor-pointer font-semibold"
            >
              Remove
            </button>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 bg-white border border-[var(--color-border)] rounded py-1 px-2 text-[11px] font-semibold cursor-pointer"
          >
            <Upload size={12} />
            {diagramFile ? 'Change' : 'Upload'}
          </button>
        </div>
      </div>
    )}
    </>
  );
}
