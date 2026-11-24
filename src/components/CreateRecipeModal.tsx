import {Film, ImagePlus, Plus, Trash2, Upload, X} from 'lucide-react';
import {useState, type ChangeEvent, type FormEvent} from 'react';
import {createRecipe, uploadVideoFile} from '../lib/api.ts';
import {formatBytesFa, toFaDigits} from '../lib/format.ts';
import {VoiceInputButton} from './VoiceInputButton.tsx';
import type {Recipe, RecipeCategory, RecipeDifficulty, StorageStats} from '../types.ts';

interface CreateRecipeModalProps {
  open: boolean;
  storage: StorageStats | null;
  onClose: () => void;
  onCreated: (recipe: Recipe, updatedStorage?: StorageStats) => void;
}

const PRESET_PHOTOS = [
  {label: 'ته‌چین زعفرانی', url: '/src/assets/images/recipe_tahchin_saffron_1795495624588.jpg'},
  {label: 'کیک شکلاتی', url: '/src/assets/images/recipe_velvet_cake_1795495624907.jpg'},
  {label: 'نان خمیرترش', url: '/src/assets/images/recipe_artisan_bread_1795495625641.jpg'},
  {label: 'کاسه گیاهی و رژیمی', url: '/src/assets/images/recipe_vegan_bowl_1795495625713.jpg'},
  {label: 'کوکو سبزی مجلسی', url: '/src/assets/images/recipe_herb_frittata_1795495625246.jpg'},
  {label: 'سفره ایرانی', url: '/src/assets/images/hero_persian_kitchen_1795495624394.jpg'},
];

export function CreateRecipeModal({open, storage, onClose, onCreated}: CreateRecipeModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('cooking');
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>('easy');
  const [prepTime, setPrepTime] = useState('45');
  const [servings, setServings] = useState('4');
  const [calories, setCalories] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isDiet, setIsDiet] = useState(false);
  const [imageUrl, setImageUrl] = useState(PRESET_PHOTOS[0].url);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoSizeBytes, setVideoSizeBytes] = useState<number | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [latestStorage, setLatestStorage] = useState<StorageStats | undefined>(undefined);

  const [ingredients, setIngredients] = useState<Array<{name: string; amount: string}>>([
    {name: '', amount: ''},
    {name: '', amount: ''},
  ]);
  const [steps, setSteps] = useState<Array<{title: string; instruction: string; tip: string}>>([
    {title: 'آماده‌سازی مواد اولیه', instruction: '', tip: ''},
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('لطفاً تصویر با فرمت JPG، PNG یا WebP انتخاب کنید.');
      return;
    }
    if (file.size > 1_500_000) {
      setError('حجم تصویر باید کمتر از ۱.۵ مگابایت باشد.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = storage?.maxVideoBytes ?? 30 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`حجم ویدیو نباید بیشتر از ${formatBytesFa(maxBytes)} باشد.`);
      return;
    }

    setError(null);
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const res = await uploadVideoFile(file, (pct) => setVideoProgress(pct));
      setVideoUrl(res.videoUrl);
      setVideoSizeBytes(res.videoSizeBytes);
      setLatestStorage(res.storage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در آپلود ویدیو');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (videoUploading) {
      setError('لطفاً تا پایان آپلود ویدیو صبر کنید.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const cleanedIngredients = ingredients.filter((i) => i.name.trim().length > 0);
      const cleanedSteps = steps
        .filter((s) => s.instruction.trim().length > 0)
        .map((s, idx) => ({
          title: s.title.trim() || `مرحله ${idx + 1}`,
          instruction: s.instruction.trim(),
          tip: s.tip.trim() || undefined,
        }));

      const res = await createRecipe({
        title: title.trim(),
        description: description.trim(),
        category,
        prepTime: Number(prepTime) || 30,
        difficulty,
        servings: Number(servings) || 4,
        calories: calories ? Number(calories) : null,
        isVegetarian,
        isDiet,
        imageUrl,
        videoUrl,
        videoSizeBytes,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
      });

      onCreated(res.recipe, latestStorage);
      setTitle('');
      setDescription('');
      setCalories('');
      setIsVegetarian(false);
      setIsDiet(false);
      setVideoUrl(null);
      setVideoSizeBytes(null);
      setIngredients([
        {name: '', amount: ''},
        {name: '', amount: ''},
      ]);
      setSteps([{title: 'آماده‌سازی مواد اولیه', instruction: '', tip: ''}]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت دستور پخت');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStorage = latestStorage ?? storage;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="ثبت دستور آشپزی، کیک‌پزی یا نان‌پزی"
    >
      <div className="w-full max-w-3xl bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 border-b border-[#E6E1D6] dark:border-[#2E2924] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">ثبت ایده و دستور پخت جدید</h2>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
              می‌توانید علاوه بر متن و تصویر، ویدیوی واقعی ضبط‌شده خود را نیز آپلود کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-2 rounded-lg bg-[#F2EFE9] dark:bg-[#26221E] text-[#1C1917] dark:text-[#F5F2EB] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="recipe-title" className="block text-xs font-medium">
                  عنوان دستور (مثلاً: طرز تهیه ته‌چین مرغ یا کیک هویج و گردو)
                </label>
                <VoiceInputButton onText={(text) => setTitle((prev) => prev ? prev + ' ' + text : text)} />
              </div>
              <input
                id="recipe-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان دقیق و جذاب بنویسید..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210] focus:outline-none focus:border-[#C25E00]"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="recipe-desc" className="block text-xs font-medium">
                  توضیح کوتاه (طعم، بافت و کاربرد دستور)
                </label>
                <VoiceInputButton onText={(text) => setDescription((prev) => prev ? prev + ' ' + text : text)} />
              </div>
              <textarea
                id="recipe-desc"
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="در یک یا دو جمله این غذا یا شیرینی را معرفی کنید..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210] focus:outline-none focus:border-[#C25E00]"
              />
            </div>

            <div>
              <label htmlFor="recipe-cat" className="block text-xs font-medium mb-1.5">
                دسته‌بندی
              </label>
              <select
                id="recipe-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210]"
              >
                <option value="cooking">آشپزی و غذای اصلی</option>
                <option value="cake">کیک و شیرینی</option>
                <option value="bread">نان‌پزی و خمیر</option>
                <option value="dessert">دسر و پیش‌غذا</option>
              </select>
            </div>

            <div>
              <label htmlFor="recipe-diff" className="block text-xs font-medium mb-1.5">
                سطح دشواری
              </label>
              <select
                id="recipe-diff"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as RecipeDifficulty)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210]"
              >
                <option value="easy">آسان</option>
                <option value="medium">متوسط</option>
                <option value="hard">حرفه‌ای</option>
              </select>
            </div>

            <div>
              <label htmlFor="recipe-time" className="block text-xs font-medium mb-1.5">
                زمان آماده‌سازی (دقیقه)
              </label>
              <input
                id="recipe-time"
                type="number"
                min={1}
                max={1440}
                required
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="recipe-servings" className="block text-xs font-medium mb-1.5">
                  تعداد نفر
                </label>
                <input
                  id="recipe-servings"
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210]"
                />
              </div>
              <div>
                <label htmlFor="recipe-calories" className="block text-xs font-medium mb-1.5">
                  کالری (اختیاری)
                </label>
                <input
                  id="recipe-calories"
                  type="number"
                  min={0}
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="مثلاً ۳۵۰"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210]"
                />
              </div>
            </div>
          </div>

          {/* Dietary Flags */}
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isVegetarian}
                onChange={(e) => setIsVegetarian(e.target.checked)}
                className="w-4 h-4 accent-[#1F5E43]"
              />
              <span>مناسب رژیم گیاهی (Vegetarian)</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isDiet}
                onChange={(e) => setIsDiet(e.target.checked)}
                className="w-4 h-4 accent-[#C25E00]"
              />
              <span>رژیمی و کم‌کالری</span>
            </label>
          </div>

          {/* Photo Picker / Upload */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">تصویر دستور پخت (انتخاب از گالری یا آپلود عکس)</span>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C25E00] dark:text-amber-400 cursor-pointer hover:underline">
                <ImagePlus className="w-4 h-4" />
                <span>آپلود از دستگاه</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="sr-only" />
              </label>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {PRESET_PHOTOS.map((photo) => {
                const selected = imageUrl === photo.url;
                return (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => setImageUrl(photo.url)}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selected ? 'border-[#C25E00] dark:border-amber-400 scale-[1.02]' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real Video Upload (Optional) */}
          <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#141210] border border-[#E6E1D6] dark:border-[#332E28] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#C25E00] dark:text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">ویدیوی واقعی آشپزی (اختیاری)</span>
              </div>
              {activeStorage && (
                <span className="text-xs text-[#78716C] dark:text-[#A8A29E] tabular-nums">
                  حداکثر ۳۰ مگابایت · فضای آزاد: {formatBytesFa(activeStorage.remainingBytes)}
                </span>
              )}
            </div>

            {!videoUrl ? (
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-[#C25E00]/50 dark:border-amber-500/40 bg-white dark:bg-[#1E1B18] text-xs sm:text-sm font-medium text-[#C25E00] dark:text-amber-400 cursor-pointer hover:bg-[#C25E00]/5 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{videoUploading ? `در حال آپلود... ${toFaDigits(videoProgress)}٪` : 'انتخاب یا ضبط ویدیو (MP4 / WebM / MOV)'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    disabled={videoUploading}
                    onChange={handleVideoUpload}
                    className="sr-only"
                  />
                </label>

                {videoUploading && (
                  <div className="h-1.5 w-full rounded-full bg-[#EFECE4] dark:bg-[#2C2722] overflow-hidden">
                    <div className="h-full bg-[#C25E00] dark:bg-amber-500 transition-[width] duration-150" style={{width: `${videoProgress}%`}} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <video src={videoUrl} controls playsInline preload="metadata" className="w-full max-h-56 rounded-xl bg-black" />
                <div className="flex items-center justify-between text-xs text-[#57534E] dark:text-[#A8A29E]">
                  <span>ویدیو آماده انتشار است {videoSizeBytes ? `(${formatBytesFa(videoSizeBytes)})` : ''}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl(null);
                      setVideoSizeBytes(null);
                    }}
                    className="text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    حذف ویدیو
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ingredients Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">مواد اولیه</h3>
              <button
                type="button"
                onClick={() => setIngredients((prev) => [...prev, {name: '', amount: ''}])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#C25E00] dark:text-amber-400 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن قلم</span>
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-end">
                      <VoiceInputButton onText={(text) => {
                        const next = [...ingredients];
                        next[idx] = {...next[idx], name: next[idx].name ? next[idx].name + ' ' + text : text};
                        setIngredients(next);
                      }} />
                    </div>
                    <input
                      type="text"
                      placeholder="نام ماده (مثلاً: برنج ایرانی)"
                      value={ing.name}
                      onChange={(e) => {
                        const next = [...ingredients];
                        next[idx] = {...next[idx], name: e.target.value};
                        setIngredients(next);
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210]"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="مقدار (مثلاً: ۲ پیمانه)"
                    value={ing.amount}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[idx] = {...next[idx], amount: e.target.value};
                      setIngredients(next);
                    }}
                    className="w-32 sm:w-44 px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210]"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="حذف ماده"
                      className="p-2 text-[#78716C] hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Steps Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">مراحل طرز تهیه</h3>
              <button
                type="button"
                onClick={() =>
                  setSteps((prev) => [
                    ...prev,
                    {title: `مرحله ${prev.length + 1}`, instruction: '', tip: ''},
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#C25E00] dark:text-amber-400 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن مرحله</span>
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#141210] border border-[#E6E1D6] dark:border-[#332E28] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#C25E00] dark:text-amber-400">
                      مرحله {toFaDigits(idx + 1)}
                    </span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label="حذف مرحله"
                        className="p-1 text-[#78716C] hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-end">
                      <VoiceInputButton onText={(text) => {
                        const next = [...steps];
                        next[idx] = {...next[idx], title: next[idx].title ? next[idx].title + ' ' + text : text};
                        setSteps(next);
                      }} />
                    </div>
                    <input
                      type="text"
                      placeholder="عنوان کوتاه مرحله"
                      value={step.title}
                      onChange={(e) => {
                        const next = [...steps];
                        next[idx] = {...next[idx], title: e.target.value};
                        setSteps(next);
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#DDD6C8] dark:border-[#36302A] bg-white dark:bg-[#1E1B18]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-end">
                      <VoiceInputButton onText={(text) => {
                        const next = [...steps];
                        next[idx] = {...next[idx], instruction: next[idx].instruction ? next[idx].instruction + ' ' + text : text};
                        setSteps(next);
                      }} />
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="شرح دقیق این مرحله از پخت..."
                      value={step.instruction}
                      onChange={(e) => {
                        const next = [...steps];
                        next[idx] = {...next[idx], instruction: e.target.value};
                        setSteps(next);
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#DDD6C8] dark:border-[#36302A] bg-white dark:bg-[#1E1B18]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EEEAE0] dark:border-[#2C2722]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[#DDD6C8] dark:border-[#36302A] cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting || videoUploading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'در حال انتشار...' : 'انتشار دستور پخت'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
