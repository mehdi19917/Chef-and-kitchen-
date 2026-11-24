import {
  Bookmark,
  Check,
  Clock,
  Flame,
  Leaf,
  Play,
  Share2,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {useEffect, useState, type ChangeEvent} from 'react';
import {attachRecipeVideo, deleteRecipe, fetchRecipeDetail, rateRecipe, uploadVideoFile} from '../lib/api.ts';
import {formatBytesFa, formatPrepTime, toFaDigits} from '../lib/format.ts';
import {CATEGORY_LABELS, DIFFICULTY_LABELS, type Recipe, type StorageStats, type User} from '../types.ts';

interface RecipeDetailModalProps {
  recipeId: number | null;
  initialRecipe?: Recipe | null;
  user: User | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onOpenVideo: (recipe: Recipe) => void;
  onShare: (recipe: Recipe) => void;
  onRecipeUpdated: (recipe: Recipe, updatedStorage?: StorageStats) => void;
  onRecipeDeleted: (id: number) => void;
}

export function RecipeDetailModal({
  recipeId,
  initialRecipe,
  user,
  onClose,
  onRequireAuth,
  onToggleFavorite,
  onOpenVideo,
  onShare,
  onRecipeUpdated,
  onRecipeDeleted,
}: RecipeDetailModalProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe ?? null);
  const [loading, setLoading] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [scale, setScale] = useState<1 | 2>(1);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    if (!recipeId) {
      setRecipe(null);
      return;
    }
    setCheckedIngredients({});
    setScale(1);
    setConfirmDelete(false);
    setFeedbackError(null);
    if (initialRecipe && initialRecipe.id === recipeId) {
      setRecipe(initialRecipe);
    }
    let active = true;
    setLoading(true);
    fetchRecipeDetail(recipeId)
      .then((res) => {
        if (active) setRecipe(res.recipe);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [recipeId]);

  useEffect(() => {
    if (initialRecipe && recipe && initialRecipe.id === recipe.id) {
      setRecipe((prev) => (prev ? {...prev, isFavorite: initialRecipe.isFavorite} : prev));
    }
  }, [initialRecipe?.isFavorite]);

  if (!recipeId) return null;

  const handleRate = async (score: number) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setFeedbackError(null);
    try {
      const res = await rateRecipe(recipeId, score);
      setRecipe(res.recipe);
      onRecipeUpdated(res.recipe);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'خطا در ثبت امتیاز');
    }
  };

  const handleAttachVideo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !recipe) return;
    if (file.size > 30 * 1024 * 1024) {
      setFeedbackError('حجم ویدیو نباید بیشتر از ۳۰ مگابایت باشد.');
      return;
    }
    setFeedbackError(null);
    setUploadingVideo(true);
    setVideoProgress(0);
    try {
      const up = await uploadVideoFile(file, (p) => setVideoProgress(p));
      const updated = await attachRecipeVideo(recipe.id, up.videoUrl, up.videoSizeBytes);
      setRecipe(updated.recipe);
      onRecipeUpdated(updated.recipe, up.storage);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'خطا در آپلود ویدیو');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    try {
      await deleteRecipe(recipe.id);
      onRecipeDeleted(recipe.id);
      onClose();
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'خطا در حذف دستور');
    }
  };

  const isOwner = Boolean(user && recipe && user.id === recipe.authorId);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={recipe?.title ?? 'جزئیات دستور پخت'}
    >
      <div className="w-full max-w-4xl bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Sticky Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#E6E1D6] dark:border-[#2E2924] flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] truncate">
              {recipe ? `${CATEGORY_LABELS[recipe.category]} · نویسنده: @${recipe.authorUsername}` : 'در حال بارگذاری...'}
            </p>
            <h2 className="text-base sm:text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB] truncate">
              {recipe?.title ?? 'جزئیات دستور پخت'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {recipe && (
              <>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(recipe)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    recipe.isFavorite
                      ? 'bg-[#C25E00] border-[#C25E00] text-white dark:bg-amber-500 dark:border-amber-500 dark:text-[#141210]'
                      : 'border-[#DDD6C8] dark:border-[#36302A] text-[#44403C] dark:text-[#D6D3CD] hover:border-[#C25E00]'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">{recipe.isFavorite ? 'ذخیره‌شده' : 'ذخیره'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShare(recipe)}
                  aria-label="اشتراک‌گذاری"
                  className="p-2 rounded-lg border border-[#DDD6C8] dark:border-[#36302A] text-[#44403C] dark:text-[#D6D3CD] hover:border-[#C25E00] cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="p-2 rounded-lg bg-[#F2EFE9] dark:bg-[#26221E] text-[#1C1917] dark:text-[#F5F2EB] hover:bg-[#E5DFD2] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-8">
          {loading && !recipe ? (
            <div className="py-16 text-center text-sm text-[#78716C]">در حال دریافت جزئیات دستور پخت...</div>
          ) : recipe ? (
            <>
              {/* Top Media + Overview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                <div className="md:col-span-6 relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#EFECE4] dark:bg-[#26221E]">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  {recipe.videoUrl && (
                    <button
                      type="button"
                      onClick={() => onOpenVideo(recipe)}
                      className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#141210] text-xs sm:text-sm font-semibold shadow-md transition-colors cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>
                        پخش ویدیوی واقعی{recipe.videoSizeBytes ? ` (${formatBytesFa(recipe.videoSizeBytes)})` : ''}
                      </span>
                    </button>
                  )}
                </div>

                <div className="md:col-span-6 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <p className="text-sm sm:text-base text-[#44403C] dark:text-[#D6D3CD] leading-7">
                      {recipe.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#141210] border border-[#E6E1D6] dark:border-[#2E2924]">
                        <p className="text-xs text-[#78716C] dark:text-[#A8A29E] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>زمان آماده‌سازی</span>
                        </p>
                        <p className="text-sm font-semibold mt-1 tabular-nums">{formatPrepTime(recipe.prepTime)}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#141210] border border-[#E6E1D6] dark:border-[#2E2924]">
                        <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">سطح دشواری</p>
                        <p className="text-sm font-semibold mt-1">{DIFFICULTY_LABELS[recipe.difficulty]}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#141210] border border-[#E6E1D6] dark:border-[#2E2924]">
                        <p className="text-xs text-[#78716C] dark:text-[#A8A29E] flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>تعداد سرو</span>
                        </p>
                        <p className="text-sm font-semibold mt-1 tabular-nums">
                          {toFaDigits(recipe.servings * scale)} نفر
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#141210] border border-[#E6E1D6] dark:border-[#2E2924]">
                        <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">نوع رژیم</p>
                        <p className="text-sm font-semibold mt-1 flex items-center gap-1.5">
                          {recipe.isVegetarian && (
                            <span className="inline-flex items-center gap-1 text-[#1F5E43] dark:text-emerald-400">
                              <Leaf className="w-3.5 h-3.5" />
                              گیاهی
                            </span>
                          )}
                          {recipe.isDiet && (
                            <span className="inline-flex items-center gap-1 text-[#C25E00] dark:text-amber-400">
                              <Flame className="w-3.5 h-3.5" />
                              رژیمی
                            </span>
                          )}
                          {!recipe.isVegetarian && !recipe.isDiet && <span>کلاسیک</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Rating Widget */}
                  <div className="p-3.5 rounded-xl bg-[#F5F2EB] dark:bg-[#24201C] border border-[#E6E1D6] dark:border-[#332E28] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#57534E] dark:text-[#A8A29E]">امتیاز شما به این دستور:</p>
                      <p className="text-xs font-medium text-[#1C1917] dark:text-[#F5F2EB] mt-0.5 tabular-nums">
                        میانگین {toFaDigits(recipe.avgRating.toFixed(1))} از ۵ ({toFaDigits(recipe.ratingCount)} رای)
                      </p>
                    </div>
                    <div className="flex items-center gap-1" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRating || recipe.userRating || 0) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => handleRate(star)}
                            aria-label={`امتیاز ${star} از ۵`}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                active
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-[#C8C2B8] dark:text-[#57534E]'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Author real video attachment option */}
              {isOwner && (
                <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#141210] border border-[#E6E1D6] dark:border-[#332E28] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E]">
                    {recipe.videoUrl
                      ? 'می‌توانید ویدیوی جدیدی جایگزین ویدیوی فعلی این دستور کنید (حداکثر ۳۰ مگابایت).'
                      : 'شما نویسنده این دستور هستید؛ می‌توانید یک ویدیوی واقعی (حداکثر ۳۰ مگابایت) به آن اضافه کنید.'}
                  </div>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingVideo ? `در حال آپلود ${toFaDigits(videoProgress)}٪` : recipe.videoUrl ? 'تغییر ویدیو' : 'افزودن ویدیوی واقعی'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      disabled={uploadingVideo}
                      onChange={handleAttachVideo}
                      className="sr-only"
                    />
                  </label>
                </div>
              )}

              {/* Ingredients & Steps Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-[#EEEAE0] dark:border-[#2C2722]">
                {/* Ingredients Checklist */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">مواد اولیه</h3>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#F2EFE9] dark:bg-[#141210] text-xs">
                      <button
                        type="button"
                        onClick={() => setScale(1)}
                        className={`px-2.5 py-1 rounded-md cursor-pointer ${
                          scale === 1 ? 'bg-white dark:bg-[#2A2520] font-semibold' : 'text-[#78716C]'
                        }`}
                      >
                        ۱ برابر
                      </button>
                      <button
                        type="button"
                        onClick={() => setScale(2)}
                        className={`px-2.5 py-1 rounded-md cursor-pointer ${
                          scale === 2 ? 'bg-white dark:bg-[#2A2520] font-semibold' : 'text-[#78716C]'
                        }`}
                      >
                        ۲ برابر
                      </button>
                    </div>
                  </div>

                  <ul className="divide-y divide-[#EEEAE0] dark:divide-[#2C2722] border border-[#E6E1D6] dark:border-[#332E28] rounded-xl bg-[#FAF9F6] dark:bg-[#141210]">
                    {recipe.ingredients.map((ing, idx) => {
                      const checked = Boolean(checkedIngredients[idx]);
                      return (
                        <li key={`${ing.name}-${idx}`}>
                          <button
                            type="button"
                            onClick={() => setCheckedIngredients((prev) => ({...prev, [idx]: !prev[idx]}))}
                            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-right text-sm cursor-pointer hover:bg-[#F2EFE9]/60 dark:hover:bg-[#1E1B18] transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                  checked
                                    ? 'bg-[#1F5E43] border-[#1F5E43] text-white'
                                    : 'border-[#C8C2B8] dark:border-[#57534E]'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3" />}
                              </span>
                              <span className={checked ? 'line-through text-[#8C857B]' : 'text-[#1C1917] dark:text-[#F5F2EB]'}>
                                {ing.name}
                              </span>
                            </span>
                            <span className="text-xs font-medium text-[#57534E] dark:text-[#A8A29E] whitespace-nowrap">
                              {scale === 2 ? `۲ × (${ing.amount})` : ing.amount}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Step-by-step Instructions */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">مراحل طرز تهیه</h3>
                    {recipe.videoUrl && (
                      <button
                        type="button"
                        onClick={() => onOpenVideo(recipe)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C25E00] dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>پخش ویدیوی دستور</span>
                      </button>
                    )}
                  </div>

                  <ol className="space-y-4">
                    {recipe.steps.map((step, idx) => (
                      <li
                        key={`${step.title}-${idx}`}
                        className="p-4 rounded-xl border border-[#E6E1D6] dark:border-[#332E28] bg-[#FAF9F6] dark:bg-[#141210] space-y-2"
                      >
                        <h4 className="text-sm font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                          {toFaDigits(idx + 1)}. {step.title}
                        </h4>
                        <p className="text-sm text-[#44403C] dark:text-[#D6D3CD] leading-7">{step.instruction}</p>
                        {step.imageUrl && (
                          <img
                            src={step.imageUrl}
                            alt={`تصویر مرحله ${idx + 1}: ${step.title}`}
                            loading="lazy"
                            className="w-full max-h-80 object-contain rounded-xl border border-[#E6E1D6] dark:border-[#332E28] bg-white dark:bg-[#1E1B18]"
                          />
                        )}
                        {step.tip && (
                          <p className="text-xs text-[#1F5E43] dark:text-emerald-400 pt-1">
                            نکته کاربردی: {step.tip}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Recipe owner controls; comments and chat are intentionally unavailable. */}
              {isOwner && (
                <div className="pt-6 border-t border-[#EEEAE0] dark:border-[#2C2722] flex justify-end">
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف این دستور</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white cursor-pointer"
                      >
                        تایید حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2.5 py-1 rounded-lg text-xs border border-[#DDD6C8] dark:border-[#36302A] cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  )}
                </div>
              )}
              {feedbackError && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                  {feedbackError}
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
