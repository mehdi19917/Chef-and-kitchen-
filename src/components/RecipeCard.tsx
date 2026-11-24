import {Bookmark, MessageSquare, Play, Share2, Star, Utensils} from 'lucide-react';
import {useState} from 'react';
import {formatPrepTime, toFaDigits} from '../lib/format.ts';
import {CATEGORY_LABELS, DIFFICULTY_LABELS, type Recipe} from '../types.ts';

interface RecipeCardProps {
  recipe: Recipe;
  onOpenDetail: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onOpenVideo: (recipe: Recipe) => void;
  onShare: (recipe: Recipe) => void;
}

export function RecipeCard({recipe, onOpenDetail, onToggleFavorite, onOpenVideo, onShare}: RecipeCardProps) {
  const [imgError, setImgError] = useState(false);

  const dietMeta: string[] = [];
  if (recipe.isVegetarian) dietMeta.push('گیاهی');
  if (recipe.isDiet) dietMeta.push('رژیمی');

  return (
    <article className="group bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      {/* 4:3 Culinary Photography with Fallback */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenDetail(recipe)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetail(recipe);
          }
        }}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE4] dark:bg-[#26221E] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
      >
        {!imgError && recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F2EFE9] to-[#E5DFD2] dark:from-[#26221E] dark:to-[#1A1714]">
            <Utensils className="w-8 h-8 text-[#A8A29E] mb-2" />
            <span className="text-xs font-medium text-[#57534E] dark:text-[#A8A29E] line-clamp-2">{recipe.title}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

        {/* Real Video Quick Action (only shown when user uploaded an actual video) */}
        {recipe.videoUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenVideo(recipe);
            }}
            title="پخش ویدیوی واقعی آشپزی"
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 text-white text-xs font-medium backdrop-blur-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>تماشای ویدیو</span>
          </button>
        )}

        {/* Save Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(recipe);
          }}
          aria-label={recipe.isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'ذخیره در علاقه‌مندی‌ها'}
          className={`absolute top-3 left-3 p-2 rounded-lg backdrop-blur-sm transition-colors cursor-pointer ${
            recipe.isFavorite
              ? 'bg-[#C25E00] text-white dark:bg-amber-500 dark:text-[#141210]'
              : 'bg-black/55 hover:bg-black/75 text-white'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Clean Unboxed Metadata (Zero Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#78716C] dark:text-[#A8A29E] mb-2">
            <span>{CATEGORY_LABELS[recipe.category]}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatPrepTime(recipe.prepTime)}</span>
            <span aria-hidden="true">·</span>
            <span>{DIFFICULTY_LABELS[recipe.difficulty]}</span>
            {dietMeta.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#1F5E43] dark:text-emerald-400 font-medium">{dietMeta.join(' · ')}</span>
              </>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-[#1C1917] dark:text-[#F5F2EB] leading-snug mb-2">
            <button
              type="button"
              onClick={() => onOpenDetail(recipe)}
              className="text-right hover:text-[#C25E00] dark:hover:text-amber-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
            >
              {recipe.title}
            </button>
          </h3>

          <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#B8B2A8] line-clamp-2 leading-6">
            {recipe.description}
          </p>
        </div>

        {/* Footer Meta & Actions */}
        <div className="pt-3 border-t border-[#EEEAE0] dark:border-[#2C2722] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-[#57534E] dark:text-[#A8A29E]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              {recipe.ratingCount > 0 ? toFaDigits(recipe.avgRating.toFixed(1)) : 'جدید'}
              {recipe.ratingCount > 0 && (
                <span className="font-normal text-[#78716C] dark:text-[#A8A29E]">
                  ({toFaDigits(recipe.ratingCount)})
                </span>
              )}
            </span>

            <span className="inline-flex items-center gap-1 tabular-nums">
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              {toFaDigits(recipe.commentCount)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#78716C] dark:text-[#A8A29E] truncate max-w-[110px]" dir="ltr">
              @{recipe.authorUsername}
            </span>
            <button
              type="button"
              onClick={() => onShare(recipe)}
              aria-label="اشتراک‌گذاری دستور"
              className="p-1.5 rounded-lg text-[#78716C] dark:text-[#A8A29E] hover:text-[#C25E00] dark:hover:text-amber-400 hover:bg-[#F5F2EB] dark:hover:bg-[#26221E] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
