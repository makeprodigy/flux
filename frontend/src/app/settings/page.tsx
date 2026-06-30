'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <AppLayout title="Settings">
      <div className="max-w-[720px] mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-[#64748B]" />
            <h1 className="font-heading text-lg font-bold text-[#352B25] tracking-tight">
              Settings
            </h1>
          </div>
          <p className="text-[#737373] font-body text-[12px] font-medium ml-4">
            Manage your account and preferences.
          </p>
        </div>
        
        {/* Settings Card */}
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#EAEAEA]">
            <Settings size={18} className="text-[#352B25]" />
            <h3 className="font-heading text-base font-bold text-[#352B25]">Profile Information</h3>
          </div>
          
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Full Name</label>
                <div className="form-input bg-[#F5F5F5] text-[#737373] border-transparent cursor-not-allowed flex items-center h-[38px]">
                  {user?.name || 'N/A'}
                </div>
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <div className="form-input bg-[#F5F5F5] text-[#737373] border-transparent cursor-not-allowed flex items-center h-[38px]">
                  {user?.email || 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Role</label>
                <div className="form-input bg-[#F5F5F5] text-[#737373] border-transparent cursor-not-allowed flex items-center h-[38px] capitalize">
                  {user?.role || 'N/A'}
                </div>
              </div>
              <div>
                <label className="form-label">School Name</label>
                <div className="form-input bg-[#F5F5F5] text-[#737373] border-transparent cursor-not-allowed flex items-center h-[38px]">
                  {user?.schoolName || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="flex justify-end">
          <button 
            onClick={handleLogout}
            className="sharp-btn-secondary !text-[#EF4444] !border-[#FCA5A5] hover:!bg-[#FEF2F2] hover:!border-[#EF4444]" 
          >
            Sign Out of Flux
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
