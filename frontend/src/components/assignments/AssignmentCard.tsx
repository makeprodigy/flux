import { format } from 'date-fns';
import { MoreVertical, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Assignment } from '@/types';

interface AssignmentCardProps {
  assignment: Assignment;
  onView: (a: Assignment) => void;
  onDelete?: (id: string) => void;
}

export default function AssignmentCard({ assignment, onView, onDelete }: AssignmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const totalQuestions = assignment.questionTypes?.reduce((acc, q) => acc + q.count, 0) || 0;
  const totalMarks = assignment.questionTypes?.reduce((acc, q) => acc + (q.count * q.marks), 0) || 0;

  return (
    <div 
      className="assignment-card flex flex-col justify-between h-full group" 
      onClick={() => onView(assignment)}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h2 className="font-heading font-bold text-[#352B25] text-[17px] tracking-tight leading-snug line-clamp-2 pr-2 group-hover:text-[#6D28D9] transition-colors">
            {assignment.topic || assignment.subject}
          </h2>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="bg-transparent border-none cursor-pointer p-1 text-[#BFBFBF] hover:text-[#737373] transition-colors rounded-md hover:bg-[#F5F5F5]"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[110%] bg-white rounded-xl border border-[#EAEAEA] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-50 min-w-[170px] overflow-hidden py-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onView(assignment); setMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 bg-transparent border-none font-body text-[12px] font-medium cursor-pointer hover:bg-[#F8F8F8] transition-colors text-[#352B25]"
                >
                  View Assignment
                </button>
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(assignment._id); setMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 bg-transparent border-none font-body text-[12px] font-medium text-[#6D28D9] cursor-pointer hover:bg-purple-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#737373] font-body">
            {assignment.subject && (
              <span className="bg-[#F8F8F8] border border-[#E5E5E5] px-2 py-0.5 rounded-md text-[#352B25] font-semibold">
                {assignment.subject}
              </span>
            )}
            {assignment.className && (
              <>
                {assignment.subject && <span className="text-[#D4D4D4]">•</span>}
                <span className="text-[#5D5D5D]">{assignment.className}</span>
              </>
            )}
          </div>
          
          {(totalQuestions > 0 || totalMarks > 0) && (
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#888888] font-inter font-medium">
              {totalQuestions > 0 && <span>{totalQuestions} Questions</span>}
              {totalQuestions > 0 && totalMarks > 0 && <span className="w-1 h-1 rounded-full bg-[#D4D4D4]"></span>}
              {totalMarks > 0 && <span>{totalMarks} Marks</span>}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-[#F0F0F0]">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="font-inter text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Assigned on</span>
            <span className="font-body text-[12px] font-medium text-[#4B5563]">
              {format(new Date(assignment.createdAt), 'dd MMM, yyyy')}
            </span>
          </div>
          {assignment.dueDate && (
            <div className="flex flex-col gap-0.5 items-end">
              <span className="font-inter text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Due</span>
              <span className="font-body text-[12px] font-medium text-[#4B5563]">
                {format(new Date(assignment.dueDate), 'dd MMM, yyyy')}
              </span>
            </div>
          )}
        </div>
        {(assignment.status === 'processing' || assignment.status === 'pending') && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-orange)] font-heading font-semibold">
            <Loader2 size={12} className="animate-spin" />
            Generating...
          </div>
        )}
      </div>
    </div>
  );
}
