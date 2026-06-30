'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  FileText,
  Book,
  PieChart,
  Settings,
  Sparkles,
  LayoutGrid,
  School,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { assignmentsApi } from '@/lib/api';
import { Logo } from '@/components/Logo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [assignmentCount, setAssignmentCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      assignmentsApi.list()
        .then((res) => {
          if (res.data?.success) {
            setAssignmentCount(res.data.data.length);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const navItems: NavItem[] = [
    { label: 'Home', href: '/dashboard', icon: <LayoutGrid size={18} strokeWidth={2} /> },
    { label: 'My Groups', href: '/groups', icon: <Users size={18} strokeWidth={2} /> },
    { label: 'Assignments', href: '/assignments', icon: <FileText size={18} strokeWidth={2} />, badge: assignmentCount > 0 ? assignmentCount : undefined },
    { label: "AI Teacher's Toolkit", href: '/toolkit', icon: <Book size={18} strokeWidth={2} /> },
    { label: 'My Library', href: '/library', icon: <PieChart size={18} strokeWidth={2} /> },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="app-sidebar bg-[#FAFAFA]/85 backdrop-blur-[12px] border border-white/50 shadow-[16px_0_80px_rgba(0,0,0,0.25),4px_0_24px_rgba(0,0,0,0.15)] rounded-[14px]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-4">
        <Logo className="w-10 h-10 shadow-md" />
        <span className="font-bricolage font-extrabold text-[26px] text-[#352B25] tracking-tight">
          Flux
        </span>
      </div>

      {/* Create button */}
      <div className="px-8 mt-10 mb-16">
        <Link
          href="/assignments/create"
          className="block p-[4px] rounded-full bg-gradient-to-r from-[#FF7A45] via-[#E65023] to-[#C93B12] hover:scale-[1.02] transition-transform duration-200 no-underline shadow-sm"
        >
          <div className="flex items-center justify-center gap-2 bg-[#352B25] text-white rounded-full py-2.5 px-4 font-inter text-[13px] font-medium w-full h-full">
            <Sparkles size={16} className="text-white fill-white" />
            Create Assignment
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-[13px] no-underline transition-all duration-150 ${
              isActive(item.href)
                ? 'bg-[#E5E7EB] text-[#352B25] font-semibold'
                : 'text-[#6B7280] font-medium hover:bg-[#F9FAFB] hover:text-[#374151]'
            }`}
          >
            <span className={`shrink-0 ${isActive(item.href) ? 'text-[#352B25]' : 'text-[#9CA3AF]'}`}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span className="ml-auto bg-[#D84315] text-white text-[10px] font-bold px-2 rounded-full min-w-[22px] h-5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 pb-6 mt-auto">
        <div className="mb-4">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-[13px] no-underline transition-all duration-150 ${
              pathname.startsWith('/settings')
                ? 'bg-[#E5E7EB] text-[#352B25] font-semibold'
                : 'text-[#6B7280] font-medium hover:bg-[#F9FAFB] hover:text-[#374151]'
            }`}
          >
            <span className={`shrink-0 ${pathname.startsWith('/settings') ? 'text-[#352B25]' : 'text-[#9CA3AF]'}`}><Settings size={18} strokeWidth={2} /></span>
            Settings
          </Link>
        </div>

        {/* School card */}
        <div className="w-full rounded-[12px] bg-[#E5E7EB] flex items-center px-4 py-3 mt-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#FFE4D6] flex items-center justify-center shrink-0 overflow-hidden">
              {user && user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <School size={20} className="text-[#D84315]" strokeWidth={2.5} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-[#352B25] truncate leading-tight tracking-tight">
                {user?.schoolName || 'Delhi Public School'}
              </p>
              <p className="text-[12px] text-[#6B7280] truncate font-medium mt-0.5">
                {user?.schoolLocation || 'Bokaro Steel City'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
