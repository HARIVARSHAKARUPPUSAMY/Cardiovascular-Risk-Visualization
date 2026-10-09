import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, X, User, Building2, Sliders, Info, HelpCircle, 
  Heart, LogOut, ChevronRight, Activity 
} from 'lucide-react';
import { OrgProfile } from '../types/cardio';

interface NavbarProps {
  orgProfile: OrgProfile | null;
  currentPage: 'dashboard' | 'patient_form' | 'clinical_dashboard';
  onNavigate: (page: 'dashboard' | 'patient_form' | 'clinical_dashboard') => void;
  onOpenMenuOption: (option: 'profile' | 'org_name' | 'settings' | 'about_us' | 'help') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  orgProfile,
  currentPage,
  onNavigate,
  onOpenMenuOption,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close hamburger menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (option: 'profile' | 'org_name' | 'settings' | 'about_us' | 'help') => {
    setMenuOpen(false);
    onOpenMenuOption(option);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 group text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors">
                  CardioRisk Clinical System
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500">
                  Clinical Edition
                </span>
              </div>
              <span className="text-xs text-slate-500 block font-normal leading-tight">
                Cardiovascular Risk Visualization &amp; Prediction
              </span>
            </div>
          </button>
        </div>

        {/* Center Navigation items */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentPage === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => onNavigate('patient_form')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentPage === 'patient_form'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Patient Details Form
          </button>
          {currentPage === 'clinical_dashboard' && (
            <>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => onNavigate('clinical_dashboard')}
                className="px-3 py-1.5 rounded-md bg-teal-50 text-teal-800 font-semibold border border-teal-200 cursor-pointer"
              >
                Clinical Dashboard &amp; 3D Heart
              </button>
            </>
          )}
        </div>

        {/* Right Section: Organisation badge + Three-line Hamburger Menu */}
        <div className="flex items-center gap-3">
          {/* Organisation info */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium truncate max-w-[180px]">
              {orgProfile?.org_name || orgProfile?.org_id || 'Hospital Facility'}
            </span>
          </div>

          {/* THREE-LINE HAMBURGER MENU IN THE UPPER-RIGHT CORNER */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Main Navigation Menu"
              className="p-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900 transition-colors shadow-xs cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                /* Explicit three-line hamburger icon */
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* DROPDOWN MENU CONTAINING THE EXACT 5 OPTIONS IN EXACT ORDER:
                1. Profile
                2. Organisation Name
                3. Settings
                4. About Us
                5. Help
            */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Institutional Menu
                  </span>
                  <span className="text-xs text-slate-800 font-medium truncate block">
                    {orgProfile?.org_name || 'Active Session'}
                  </span>
                </div>

                {/* 1. Profile */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('profile')}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
                    <div>
                      <span className="font-medium block text-slate-800">1. Profile</span>
                      <span className="text-[10px] text-slate-500 block">Credentials &amp; Access</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {/* 2. Organisation Name */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('org_name')}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
                    <div>
                      <span className="font-medium block text-slate-800">2. Organisation Name</span>
                      <span className="text-[10px] text-slate-500 block">Institution profile</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {/* 3. Settings */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('settings')}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
                    <div>
                      <span className="font-medium block text-slate-800">3. Settings</span>
                      <span className="text-[10px] text-slate-500 block">Risk thresholds</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {/* 4. About Us */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('about_us')}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
                    <div>
                      <span className="font-medium block text-slate-800">4. About Us</span>
                      <span className="text-[10px] text-slate-500 block">Dataset &amp; methodology</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {/* 5. Help */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('help')}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
                    <div>
                      <span className="font-medium block text-slate-800">5. Help</span>
                      <span className="text-[10px] text-slate-500 block">User guide &amp; workflow</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {/* Divider & Log out */}
                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
