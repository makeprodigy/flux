'use client';

import { ArrowLeft, LayoutGrid, Bell, ChevronDown, LogOut, User, Menu, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Logo } from '@/components/Logo';

interface TopBarProps {
  title: string;
  backHref?: string;
  breadcrumb?: string;
}

export default function TopBar({ title, backHref, breadcrumb }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isTopLevel = ['/', '/dashboard', '/assignments', '/groups', '/toolkit', '/library', '/settings'].includes(pathname);
  const showBackButton = backHref || !isTopLevel;

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-1 z-10 shrink-0 bg-white/60 backdrop-blur-[24px] border border-white/80 rounded-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Left: Desktop Breadcrumbs & Mobile Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <div className="flex md:hidden items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <Logo className="w-[34px] h-[34px] shadow-sm" />
          <span className="font-bricolage font-extrabold text-[18px] text-[#352B25] tracking-tight">
            Flux
          </span>
        </div>

        {/* Desktop Breadcrumbs */}
        <div className="hidden md:flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={() => backHref ? router.push(backHref) : router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer border border-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-[#352B25]" strokeWidth={2} />
            </button>
          )}

          <div className="flex items-center gap-2.5 ml-1">
            <LayoutGrid size={20} className="text-[#9CA3AF]" strokeWidth={2} />
            {breadcrumb && (
              <>
                <span className="text-[16px] font-semibold text-[#9CA3AF] font-bricolage">{breadcrumb}</span>
                <span className="text-[16px] font-semibold text-[#9CA3AF] mx-0.5">/</span>
              </>
            )}
            <h1 className="text-[16px] font-semibold text-[#9CA3AF] font-bricolage">{title}</h1>
          </div>
        </div>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notification bell — plain icon with red dot badge */}
        <div className="relative group cursor-pointer">
          <Bell size={20} className="text-[#374151]" strokeWidth={1.8} />
          {/* Red dot badge */}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />

          {/* Hover dropdown */}
          <div className="absolute right-0 mt-3 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 w-[280px] top-full py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-[14px] font-semibold font-heading text-[#352B25]">Notifications</span>
            </div>
            <div className="px-4 py-3">
              <p className="text-[13px] font-body text-[#555] mb-1">You have new assignments to review!</p>
              <p className="text-[11px] font-body text-[#999] m-0">2 hours ago</p>
            </div>
            <div className="px-4 py-2 text-center border-t border-gray-100">
              <button className="text-[12px] font-semibold font-body text-[#D84315] bg-transparent border-none cursor-pointer">Mark all as read</button>
            </div>
          </div>
        </div>

        {/* User pill */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 bg-white md:border md:border-gray-200 rounded-full md:pl-1.5 md:pr-3 md:py-1.5 transition-all cursor-pointer border-none"
          >
            {/* Avatar circle */}
            <div className="w-[34px] h-[34px] md:w-8 md:h-8 rounded-full bg-[#f0e6d3] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#8B5E2D] font-bold text-[12px]">{initials}</span>
              )}
            </div>
            <span className="hidden md:block font-semibold text-[#352B25] text-[13px] max-w-[110px] truncate ml-1">
              {user?.name ?? 'Demo Teacher'}
            </span>
            <ChevronDown size={14} className="text-[#6B7280] hidden md:block" />
          </button>

          {/* Dropdown menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 mb-1">
                <p className="font-heading text-[14px] font-semibold text-[#352B25] m-0 truncate">{user?.name ?? 'Demo Teacher'}</p>
                <p className="font-body text-[12px] text-[#737373] mt-0.5 mb-0 truncate">{user?.email ?? 'teacher@flux.app'}</p>
              </div>
              <button className="w-full text-left px-4 py-2.5 text-[13px] font-body font-medium text-[#555] bg-transparent border-none flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                <User size={14} /> Profile Settings
              </button>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2.5 text-[13px] font-body font-medium text-red-500 bg-transparent border-none flex items-center gap-2 cursor-pointer hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>

        {/* Hamburger Menu (Visible on Mobile) */}
        <div className="relative md:hidden">
          <button 
            onClick={() => setIsHamburgerMenuOpen(!isHamburgerMenuOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border-none text-[#352B25] cursor-pointer hover:opacity-70 transition-opacity ml-1 md:ml-2"
          >
            <Menu size={24} strokeWidth={2} />
          </button>
          
          {/* Hamburger Dropdown menu */}
          {isHamburgerMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[180px] bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 py-2 overflow-hidden">
              <button 
                onClick={() => { setIsHamburgerMenuOpen(false); router.push('/settings'); }}
                className="w-full text-left px-4 py-2.5 text-[13px] font-body font-medium text-[#352B25] bg-transparent border-none flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Settings size={16} className="text-[#6B7280]" /> Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
