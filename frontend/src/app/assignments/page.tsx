'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Search, Filter, MoreVertical, ChevronDown, Check, Database, Trash2, ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import ZeroState from '@/components/dashboard/ZeroState';
import { assignmentsApi } from '@/lib/api';
import { Assignment } from '@/types';
import AssignmentCard from '@/components/assignments/AssignmentCard';
import GradualBlur from '@/components/GradualBlur';

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filtered, setFiltered] = useState<Assignment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterDueDate, setFilterDueDate] = useState<'all' | 'upcoming' | 'past_due'>('all');

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Extract unique options for filters
  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(assignments.map(a => a.subject))).filter(Boolean);
  }, [assignments]);

  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(assignments.map(a => a.className))).filter(Boolean);
  }, [assignments]);

  // Apply Search, Filters, and Sorting
  useEffect(() => {
    let result = [...assignments];

    // 1. Search Filter
    if (search.trim() !== '') {
      result = result.filter(
        (a) =>
          a.subject.toLowerCase().includes(search.toLowerCase()) ||
          a.topic.toLowerCase().includes(search.toLowerCase()) ||
          (a.className && a.className.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // 2. Subject Filter
    if (filterSubject !== 'all') {
      result = result.filter(a => a.subject === filterSubject);
    }

    // 3. Class Filter
    if (filterClass !== 'all') {
      result = result.filter(a => a.className === filterClass);
    }

    // 4. Due Date Filter
    if (filterDueDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      result = result.filter(a => {
        if (!a.dueDate) return false;
        const due = new Date(a.dueDate);
        if (filterDueDate === 'upcoming') {
          return due >= today;
        } else if (filterDueDate === 'past_due') {
          return due < today;
        }
        return true;
      });
    }

    // 5. Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

    setFiltered(result);
  }, [search, assignments, sortOrder, filterSubject, filterClass, filterDueDate]);

  const fetchAssignments = async () => {
    try {
      const res = await assignmentsApi.list();
      setAssignments(res.data.data || []);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await assignmentsApi.delete(id);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch {
      alert('Failed to delete assignment.');
    }
    setMenuOpen(null);
  };

  const handleView = (a: Assignment) => {
    if (a.status === 'completed' && a.jobId) {
      router.push(`/assignments/result/${a.jobId}`);
    } else if (a.status === 'processing' || a.status === 'pending') {
      alert('This assignment is still generating. Please wait a moment.');
    } else if (a.status === 'failed') {
      alert('Generation failed. Please delete this assignment and try again.');
    }
  };

  if (loading) {
    return (
      <AppLayout title="Assignments">
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-dark)] rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (assignments.length === 0) {
    return (
      <AppLayout title="Assignments">
        <ZeroState />
      </AppLayout>
    );
  }

  const handleDemoToggle = async () => {
    if (assignments.length > 0) {
      if (!confirm('Delete all demo data? This cannot be undone.')) return;
      try {
        await Promise.all(assignments.map(a => assignmentsApi.delete(a._id)));
        setAssignments([]);
      } catch {
        alert('Failed to delete demo data.');
      }
    } else {
      try {
        await assignmentsApi.seed();
        await fetchAssignments();
      } catch {
        alert('Failed to load demo data.');
      }
    }
  };

  return (
    <AppLayout title="Assignments">
      <div className="py-4 relative">
        {/* Mobile Page Header */}
        <div className="flex md:hidden items-center justify-between mb-6 mt-2 relative">
          <button onClick={() => router.back()} className="absolute left-0 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm cursor-pointer z-10">
            <ArrowLeft size={16} className="text-[#171717]" />
          </button>
          <h1 className="w-full text-center font-heading text-lg font-bold text-[#171717]">Assignments</h1>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex mb-3 justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <h1 className="font-heading text-lg font-bold text-[#171717] tracking-tight">
                Assignments
              </h1>
            </div>
            <p className="text-[#737373] font-body text-[12px] font-medium ml-4">
              Manage and create assignments for your classes.
            </p>
          </div>
          
          <button 
            onClick={handleDemoToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-heading text-[13px] font-bold border transition-colors cursor-pointer ${
              assignments.length > 0
                ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                : 'bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#171717] border-[#E5E5E5]'
            }`}
          >
            {assignments.length > 0
              ? <><Trash2 size={14} /> Delete Demo Data</>
              : <><Database size={14} /> Load Demo Data</>
            }
          </button>
        </div>

        {/* Filter + Search Bar */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white/60 backdrop-blur-[24px] rounded-xl border border-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-3 sm:px-3 sm:py-2">
          
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center w-full sm:w-auto gap-2 border border-gray-100 sm:border-none font-body text-[13px] font-medium cursor-pointer transition-colors duration-200 px-3 py-2 sm:-ml-2 rounded-lg ${isFilterOpen ? 'text-[#5D5D5D] bg-[#F5F5F5]' : 'bg-white sm:bg-transparent text-[#8A8A8A] hover:text-[#5D5D5D] hover:bg-[#F9F9F9]'}`}
            >
              <Filter size={16} strokeWidth={2} /> Filter By
            </button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5E5] p-4 z-[100] flex flex-col gap-3">
                
                {/* Sort Order */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider mb-1.5">Sort By</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSortOrder('latest')} className={`flex-1 p-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${sortOrder === 'latest' ? 'border border-[#171717] bg-[#171717] text-white' : 'border border-[#E5E5E5] bg-white text-[#171717]'}`}>Latest</button>
                    <button onClick={() => setSortOrder('oldest')} className={`flex-1 p-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${sortOrder === 'oldest' ? 'border border-[#171717] bg-[#171717] text-white' : 'border border-[#E5E5E5] bg-white text-[#171717]'}`}>Oldest</button>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider mb-1.5">Subject</label>
                  <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full px-2.5 py-2 rounded-md border border-[#E5E5E5] bg-white text-[12px] outline-none">
                    <option value="all">All Subjects</option>
                    {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>

                {/* Class */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider mb-1.5">Class</label>
                  <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full px-2.5 py-2 rounded-md border border-[#E5E5E5] bg-white text-[12px] outline-none">
                    <option value="all">All Classes</option>
                    {uniqueClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider mb-1.5">Due Date</label>
                  <select value={filterDueDate} onChange={(e) => setFilterDueDate(e.target.value as any)} className="w-full px-2.5 py-2 rounded-md border border-[#E5E5E5] bg-white text-[12px] outline-none">
                    <option value="all">Any Time</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past_due">Past Due</option>
                  </select>
                </div>

                <div className="h-[1px] bg-[#F0F0F0]" />

                {/* Reset Filters */}
                <button 
                  onClick={() => { setSortOrder('latest'); setFilterSubject('all'); setFilterClass('all'); setFilterDueDate('all'); }}
                  className="w-full p-2 rounded-md border-none bg-[#F9F9F9] text-[#EF4444] text-[12px] font-semibold cursor-pointer hover:bg-[#FFF0F0] transition-colors"
                >
                  Reset Filters
                </button>

              </div>
            )}
          </div>

          <div className="relative w-full sm:w-[320px]">
            <div className="flex items-center rounded-full border border-[#E5E5E5] bg-white px-3 py-2 focus-within:border-[#D84315] focus-within:ring-1 focus-within:ring-[#D84315] transition-all">
              <Search size={15} className="text-[#A3A3A3] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Assignment"
                className="w-full bg-transparent border-none outline-none text-[13px] font-body pl-2 text-[#171717] placeholder:text-[#A3A3A3]"
              />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-24">
          {filtered.map((a) => (
            <AssignmentCard
              key={a._id}
              assignment={a}
              onView={handleView}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Desktop Sticky Create Button */}
      <div 
        className="hidden md:flex fixed bottom-0 right-0 h-[12rem] pointer-events-none z-30 items-end justify-center pb-8"
        style={{ left: 'calc(var(--sidebar-width) + 16px)' }}
      >
        <div className="absolute inset-0 backdrop-blur-[12px] [mask-image:linear-gradient(to_bottom,transparent,black_75%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_75%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/40 to-transparent opacity-80" />
        
        <Link 
          href="/assignments/create" 
          className="relative pointer-events-auto flex items-center gap-2 bg-[#171717] text-white px-6 py-3 rounded-full font-heading text-[14px] font-bold no-underline shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#FF5623] hover:shadow-[0_12px_28px_rgba(255,86,35,0.25)]"
        >
          <Plus size={16} strokeWidth={2.5} /> Create Assignment
        </Link>
      </div>
    </AppLayout>
  );
}
