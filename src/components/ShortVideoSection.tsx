import {Film, HardDrive, Play, Upload} from 'lucide-react';
import {formatBytesFa, toFaDigits} from '../lib/format.ts';
import {CATEGORY_LABELS, type Recipe, type StorageStats} from '../types.ts';

interface ShortVideoSectionProps {
  recipes: Recipe[];
  storage: StorageStats | null;
  onPlayVideo: (recipe: Recipe) => void;
  onOpenDetail: (recipe: Recipe) => void;
  onOpenCreate: () => void;
}

export function ShortVideoSection({
  recipes,
  storage,
  onPlayVideo,
  onOpenDetail,
  onOpenCreate,
}: ShortVideoSectionProps) {
  const videoRecipes = recipes.filter((r) => Boolean(r.videoUrl));

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E6E1D6] dark:border-[#2E2924] pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#F5F2EB] flex items-center gap-2">
            <Film className="w-6 h-6 text-[#C25E00] dark:text-amber-400 shrink-0" />
            <span>ویدیوهای واقعی آشپزی کاربران</span>
          </h2>
          <p className="text-sm text-[#57534E] dark:text-[#A8A29E] mt-1">
            در این بخش فقط ویدیوهای واقعی که توسط کاربران ضبط و آپلود شده‌اند نمایش داده می‌شوند (سقف هر ویدیو: ۳۰ مگابایت).
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Upload className="w-4 h-4 shrink-0" />
          <span>ثبت دستور همراه با ویدیوی واقعی</span>
        </button>
      </div>

      {/* Real Storage Quota Bar */}
      {storage && (
        <div className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-[#44403C] dark:text-[#D6D3CD]">
            <HardDrive className="w-5 h-5 text-[#1F5E43] dark:text-emerald-400 shrink-0" />
            <span>
              سقف هر ویدیو: <strong className="tabular-nums">{formatBytesFa(storage.maxVideoBytes)}</strong> (فرمت MP4، WebM یا MOV)
            </span>
          </div>
          <div className="text-[#57534E] dark:text-[#A8A29E] tabular-nums">
            فضای مصرف‌شده: <strong>{formatBytesFa(storage.usedBytes)}</strong> از{' '}
            <strong>{formatBytesFa(storage.totalQuotaBytes)}</strong> ·{' '}
            <span className="text-[#1F5E43] dark:text-emerald-400 font-semibold">
              {formatBytesFa(storage.remainingBytes)} آزاد
            </span>
          </div>
        </div>
      )}

      {videoRecipes.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-10 sm:p-14 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] dark:bg-[#26221E] flex items-center justify-center mx-auto text-[#C25E00] dark:text-amber-400">
            <Film className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            هنوز هیچ ویدیوی واقعی بارگذاری نشده است
          </h3>
          <p className="text-sm text-[#57534E] dark:text-[#A8A29E] leading-7">
            برای حفظ اصالت، هیچ ویدیوی نمایشی ساختگی در اینجا قرار داده نشده است. اولین نفری باشید که یک کلیپ کوتاه واقعی (حداکثر ۳۰ مگابایت) از آشپزی، کیک‌پزی یا نان‌پزی خود آپلود می‌کند!
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>آپلود اولین ویدیوی آشپزی</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoRecipes.map((recipe) => (
            <article
              key={recipe.id}
              className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl overflow-hidden flex flex-col"
            >
              <button
                type="button"
                onClick={() => onPlayVideo(recipe)}
                className="relative aspect-[4/3] w-full overflow-hidden bg-[#181512] group cursor-pointer text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
              >
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-14 h-14 rounded-full bg-amber-500/95 group-hover:bg-amber-400 text-[#141210] flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
                    <Play className="w-6 h-6 fill-current mr-0.5" />
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs text-white tabular-nums">
                  <span>{toFaDigits(recipe.steps.length)} مرحله</span>
                  {recipe.videoSizeBytes ? <span>{formatBytesFa(recipe.videoSizeBytes)}</span> : null}
                </div>
              </button>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mb-1">
                    {CATEGORY_LABELS[recipe.category]} · @{recipe.authorUsername}
                  </p>
                  <h3 className="text-base font-semibold text-[#1C1917] dark:text-[#F5F2EB] leading-snug">
                    {recipe.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#EEEAE0] dark:border-[#2C2722]">
                  <button
                    type="button"
                    onClick={() => onPlayVideo(recipe)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors cursor-pointer"
                  >
                    پخش ویدیو
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(recipe)}
                    className="py-2 px-3 rounded-lg text-xs font-medium border border-[#DDD6C8] dark:border-[#36302A] text-[#44403C] dark:text-[#D6D3CD] hover:border-[#C25E00] transition-colors cursor-pointer"
                  >
                    متن دستور
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
