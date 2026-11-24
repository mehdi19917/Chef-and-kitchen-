import {Clock, Flame, Leaf, RotateCcw, Search, SlidersHorizontal} from 'lucide-react';
import type {RecipeCategory, RecipeDifficulty} from '../types.ts';

export interface FilterState {
  q: string;
  category: RecipeCategory | 'all';
  difficulty: RecipeDifficulty | 'all';
  timeRange: 'all' | 'quick' | 'medium' | 'long';
  vegetarian: boolean;
  diet: boolean;
}

interface FilterToolbarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}

export function FilterToolbar({filters, onChange, onReset}: FilterToolbarProps) {
  const categories: Array<{id: RecipeCategory | 'all'; label: string}> = [
    {id: 'all', label: 'همه دستورها'},
    {id: 'cooking', label: 'آشپزی'},
    {id: 'cake', label: 'کیک و شیرینی'},
    {id: 'bread', label: 'نان‌پزی'},
    {id: 'dessert', label: 'دسر و پیش‌غذا'},
  ];

  const timeOptions: Array<{id: FilterState['timeRange']; label: string}> = [
    {id: 'all', label: 'همه زمان‌ها'},
    {id: 'quick', label: 'سریع (تا ۳۰ دقیقه)'},
    {id: 'medium', label: 'متوسط (۳۰ تا ۶۰ دقیقه)'},
    {id: 'long', label: 'طولانی (بالای ۶۰ دقیقه)'},
  ];

  const difficultyOptions: Array<{id: RecipeDifficulty | 'all'; label: string}> = [
    {id: 'all', label: 'همه سطوح'},
    {id: 'easy', label: 'آسان'},
    {id: 'medium', label: 'متوسط'},
    {id: 'hard', label: 'حرفه‌ای'},
  ];

  const hasActiveFilters =
    filters.q.trim() !== '' ||
    filters.category !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.timeRange !== 'all' ||
    filters.vegetarian ||
    filters.diet;

  return (
    <div className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Row 1: Search + Quick Vegetarian & Diet Toggles */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#78716C] dark:text-[#A8A29E] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => onChange({...filters, q: e.target.value})}
            placeholder="جستجوی نام غذا، کیک، نان یا ماده اولیه (مثلاً: ته‌چین، زعفران، کیک شکلاتی)..."
            className="w-full pr-10 pl-4 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210] text-[#1C1917] dark:text-[#F5F2EB] placeholder:text-[#8C857B] focus:outline-none focus:border-[#C25E00] dark:focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Quick Vegetarian & Diet-Friendly Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onChange({...filters, vegetarian: !filters.vegetarian})}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filters.vegetarian
                ? 'bg-[#1F5E43] border-[#1F5E43] text-white dark:bg-emerald-600 dark:border-emerald-600'
                : 'bg-[#FAF9F6] dark:bg-[#141210] border-[#DDD6C8] dark:border-[#36302A] text-[#44403C] dark:text-[#D6D3CD] hover:border-[#1F5E43] dark:hover:border-emerald-500'
            }`}
          >
            <Leaf className="w-4 h-4 shrink-0" />
            <span>فقط غذاهای گیاهی</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({...filters, diet: !filters.diet})}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filters.diet
                ? 'bg-[#C25E00] border-[#C25E00] text-white dark:bg-amber-500 dark:border-amber-500 dark:text-[#141210]'
                : 'bg-[#FAF9F6] dark:bg-[#141210] border-[#DDD6C8] dark:border-[#36302A] text-[#44403C] dark:text-[#D6D3CD] hover:border-[#C25E00] dark:hover:border-amber-500'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0" />
            <span>رژیمی و کم‌کالری</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Categories + Prep Time + Difficulty */}
      <div className="pt-3 border-t border-[#EEEAE0] dark:border-[#2C2722] flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F2EFE9] dark:bg-[#141210] overflow-x-auto">
          {categories.map((cat) => {
            const active = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange({...filters, category: cat.id})}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#2A2520] text-[#1C1917] dark:text-[#F5F2EB] shadow-xs font-semibold'
                    : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Prep Time & Difficulty Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#78716C] dark:text-[#A8A29E] shrink-0" />
            <label htmlFor="prep-time-filter" className="text-xs text-[#57534E] dark:text-[#A8A29E] whitespace-nowrap">
              زمان آماده‌سازی:
            </label>
            <select
              id="prep-time-filter"
              value={filters.timeRange}
              onChange={(e) => onChange({...filters, timeRange: e.target.value as FilterState['timeRange']})}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210] text-[#1C1917] dark:text-[#F5F2EB] focus:outline-none focus:border-[#C25E00] cursor-pointer"
            >
              {timeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#78716C] dark:text-[#A8A29E] shrink-0" />
            <label htmlFor="difficulty-filter" className="text-xs text-[#57534E] dark:text-[#A8A29E] whitespace-nowrap">
              سطح دشواری:
            </label>
            <select
              id="difficulty-filter"
              value={filters.difficulty}
              onChange={(e) => onChange({...filters, difficulty: e.target.value as FilterState['difficulty']})}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210] text-[#1C1917] dark:text-[#F5F2EB] focus:outline-none focus:border-[#C25E00] cursor-pointer"
            >
              {difficultyOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
