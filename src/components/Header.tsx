import {Menu, Plus, X} from 'lucide-react';
import {useState} from 'react';

export type NavTab = 'explore' | 'fridge' | 'videos' | 'profile';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreate: () => void;
}

export function Header({activeTab, onSelectTab, onOpenCreate}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{id: NavTab; label: string}> = [
    {id: 'explore', label: 'کاوش دستورها'},
    {id: 'fridge', label: 'یخچال من'},
    {id: 'videos', label: 'ویدیوهای کوتاه'},
    {id: 'profile', label: 'علاقه‌مندی‌ها'},
  ];

  const handleNav = (id: NavTab) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E6E1D6] dark:border-[#2E2924] bg-[#FAF9F6]/95 dark:bg-[#141210]/95 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('explore')}
          className="font-display text-2xl sm:text-3xl tracking-tight text-[#1C1917] dark:text-[#F5F2EB] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded-md px-1"
        >
          پخت‌نگار
        </button>

        {/* Zone 2: 4 Clean Single-Line Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${
                  isActive
                    ? 'border-[#C25E00] dark:border-amber-400 text-[#1C1917] dark:text-[#F5F2EB] font-semibold'
                    : 'border-transparent text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>ثبت دستور جدید</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="منوی ناوبری"
            className="md:hidden p-2 rounded-lg border border-[#E6E1D6] dark:border-[#332E28] text-[#1C1917] dark:text-[#F5F2EB] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E6E1D6] dark:border-[#2E2924] bg-[#FAF9F6] dark:bg-[#141210] px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-right px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EFECE4] dark:bg-[#26221E] text-[#C25E00] dark:text-amber-400 font-semibold'
                    : 'text-[#57534E] dark:text-[#A8A29E] hover:bg-[#F2EFE9] dark:hover:bg-[#1E1B18]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
