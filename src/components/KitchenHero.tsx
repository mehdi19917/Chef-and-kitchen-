import {LogOut, Moon, Play, Refrigerator, Sun, User as UserIcon} from 'lucide-react';
import {toFaDigits} from '../lib/format.ts';
import type {User} from '../types.ts';
import {PWAInstallButton} from './PWAInstallButton.tsx';

interface KitchenHeroProps {
  user: User | null;
  theme: 'light' | 'dark';
  recipeCount: number;
  videoCount: number;
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onGoFridge: () => void;
  onGoVideos: () => void;
  onOpenProfile: () => void;
}

export function KitchenHero({
  user,
  theme,
  recipeCount,
  videoCount,
  onToggleTheme,
  onOpenAuth,
  onLogout,
  onGoFridge,
  onGoVideos,
  onOpenProfile,
}: KitchenHeroProps) {
  return (
    <section className="border-b border-[#E6E1D6] dark:border-[#2E2924] bg-[#F5F2EB] dark:bg-[#1A1714]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 pb-8 sm:pt-7 sm:pb-10">
        {/* Workspace Control Bar: Theme Toggle + PWA Install + Simple Username Account */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-[#E6E1D6] dark:border-[#2E2924]">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E]">
            <span>جامعه آزاد آشپزی، کیک‌پزی و نان‌پزی</span>
            <span aria-hidden="true">·</span>
            <span>بدون نام و مشخصات شخصی</span>
            <span aria-hidden="true">·</span>
            <span>بدون چت خصوصی</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <PWAInstallButton />

            {/* Dark / Light Mode Toggle for Kitchen Eye Comfort */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium border border-[#DDD6C8] dark:border-[#36302A] bg-white dark:bg-[#24201C] text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#C25E00] dark:hover:border-amber-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="تغییر مود تیره و روشن آشپزخانه"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>حالت روشن روز</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#C25E00] shrink-0" />
                  <span>حالت تیره آشپزخانه</span>
                </>
              )}
            </button>

            {/* Simple Username Account Control */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium border border-[#DDD6C8] dark:border-[#36302A] bg-white dark:bg-[#24201C] text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#C25E00] dark:hover:border-amber-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <UserIcon className="w-4 h-4 text-[#1F5E43] dark:text-emerald-400 shrink-0" />
                  <span>@{user.username}</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  title="خروج از حساب"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border border-[#DDD6C8] dark:border-[#36302A] bg-white dark:bg-[#24201C] text-[#57534E] dark:text-[#A8A29E] hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>خروج</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-[#C25E00] dark:border-amber-500 text-[#C25E00] dark:text-amber-400 bg-white dark:bg-[#24201C] hover:bg-[#C25E00]/5 dark:hover:bg-amber-500/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <UserIcon className="w-4 h-4 shrink-0" />
                <span>ورود / ثبت‌نام با نام کاربری</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Editorial Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.2] text-[#1C1917] dark:text-[#F5F2EB] [text-wrap:balance] mb-4">
              هر ایده آشپزی، کیک و نان خانگی را با یک نام کاربری ساده ثبت و کشف کنید
            </h1>
            <p className="text-sm sm:text-base text-[#57534E] dark:text-[#B8B2A8] leading-7 max-w-xl mb-6">
              دستورهای آزمایش‌شده از ته‌چین زعفرانی و نان خمیرترش تا کیک‌های خانگی و غذاهای گیاهی و رژیمی را
              ببینید، با مواد داخل یخچال خود جستجو کنید، ویدیوهای واقعی پخت‌وپز را آپلود و تماشا کنید و به بهترین دستورها امتیاز بدهید.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGoFridge}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#1F5E43] hover:bg-[#184B35] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Refrigerator className="w-4 h-4 shrink-0" />
                <span>جستجو با مواد داخل یخچال</span>
              </button>

              <button
                type="button"
                onClick={onGoVideos}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-[#DDD6C8] dark:border-[#36302A] bg-white dark:bg-[#24201C] text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#C25E00] dark:hover:border-amber-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 text-[#C25E00] dark:text-amber-400 shrink-0" />
                <span>ویدیوهای واقعی آشپزی</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[280px] rounded-2xl overflow-hidden border border-[#E6E1D6] dark:border-[#332E28] bg-[#E8E2D5] dark:bg-[#24201C]">
              <img
                src="/src/assets/images/hero_persian_kitchen_1795495624394.jpg"
                alt="سفره اصیل ته‌چین زعفرانی، نان خمیرترش و سبزی تازه در پخت‌نگار"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between gap-4 text-white">
                <div>
                  <p className="text-xs text-white/80 mb-0.5">پیشنهاد ویژه سرآشپزهای پخت‌نگار</p>
                  <p className="text-base sm:text-lg font-semibold">ته‌چین مجلسی و نان‌های دست‌ساز خانگی</p>
                </div>
                <span className="text-xs text-white/90 tabular-nums whitespace-nowrap">
                  {toFaDigits(recipeCount)} دستور فعال
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Metrics Strip Below Hero Split */}
        <div className="mt-8 pt-6 border-t border-[#E6E1D6] dark:border-[#2E2924] grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mb-1">حفظ حریم خصوصی</p>
            <p className="text-sm sm:text-base font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
              ثبت‌نام فقط با نام کاربری
            </p>
          </div>
          <div>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mb-1">آرشیو دستورها</p>
            <p className="text-sm sm:text-base font-semibold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
              {toFaDigits(recipeCount)} دستور · {toFaDigits(videoCount)} ویدیوی واقعی
            </p>
          </div>
          <div>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mb-1">جستجوی هوشمند</p>
            <p className="text-sm sm:text-base font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
              تطبیق با مواد یخچال
            </p>
          </div>
          <div>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mb-1">راحتی چشم در آشپزخانه</p>
            <p className="text-sm sm:text-base font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
              پشتیبانی از مود تیره و روشن
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
