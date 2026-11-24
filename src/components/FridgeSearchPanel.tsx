import {Check, Plus, Refrigerator, Trash2, X} from 'lucide-react';
import {useMemo, useState, type FormEvent} from 'react';
import {formatPrepTime, matchRecipesWithFridge, toFaDigits} from '../lib/format.ts';
import type {Recipe} from '../types.ts';

interface FridgeSearchPanelProps {
  recipes: Recipe[];
  onOpenDetail: (recipe: Recipe) => void;
}

const PANTRY_STAPLES = [
  'برنج',
  'تخم‌مرغ',
  'زعفران',
  'ماست',
  'بادمجان',
  'مرغ',
  'آرد',
  'شکر',
  'کره',
  'گردو',
  'زرشک',
  'شکلات',
  'کینوا',
  'نخود',
  'سبزی',
];

export function FridgeSearchPanel({recipes, onOpenDetail}: FridgeSearchPanelProps) {
  const [inputVal, setInputVal] = useState('');
  const [fridgeItems, setFridgeItems] = useState<string[]>(['تخم‌مرغ', 'برنج', 'زعفران']);

  const addIngredient = (raw: string) => {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (!fridgeItems.some((item) => item === cleaned)) {
      setFridgeItems((prev) => [...prev, cleaned]);
    }
    setInputVal('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    addIngredient(inputVal);
  };

  const removeIngredient = (item: string) => {
    setFridgeItems((prev) => prev.filter((x) => x !== item));
  };

  const matches = useMemo(() => matchRecipesWithFridge(recipes, fridgeItems), [recipes, fridgeItems]);

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#F5F2EB] flex items-center gap-2">
              <Refrigerator className="w-6 h-6 text-[#1F5E43] dark:text-emerald-400 shrink-0" />
              <span>جستجوی پیشرفته با مواد موجود در یخچال</span>
            </h2>
            <p className="text-sm text-[#57534E] dark:text-[#A8A29E] mt-1">
              موادی که همین الان در آشپزخانه دارید را وارد یا انتخاب کنید تا ببینید چه غذاها، کیک‌ها یا نان‌هایی می‌توانید بپزید.
            </p>
          </div>
          {fridgeItems.length > 0 && (
            <button
              type="button"
              onClick={() => setFridgeItems([])}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#78716C] hover:text-red-600 dark:text-[#A8A29E] dark:hover:text-red-400 cursor-pointer whitespace-nowrap self-start sm:self-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>خالی کردن لیست یخچال</span>
            </button>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="نام ماده اولیه را بنویسید (مثلاً: بادمجان، شکلات، ماست، گردو)..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210] text-[#1C1917] dark:text-[#F5F2EB] focus:outline-none focus:border-[#1F5E43] dark:focus:border-emerald-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1F5E43] hover:bg-[#184B35] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>افزودن ماده</span>
          </button>
        </form>

        {/* Active Selected Fridge Items */}
        {fridgeItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-[#57534E] dark:text-[#A8A29E]">در یخچال شما:</span>
            {fridgeItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => removeIngredient(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1F5E43]/10 dark:bg-emerald-500/15 text-[#1F5E43] dark:text-emerald-300 border border-[#1F5E43]/25 dark:border-emerald-500/30 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition-colors cursor-pointer"
              >
                <span>{item}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        )}

        {/* Quick Pantry Staples */}
        <div className="pt-3 border-t border-[#EEEAE0] dark:border-[#2C2722]">
          <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mb-2.5">انتخاب سریع مواد پرکاربرد:</p>
          <div className="flex flex-wrap gap-2">
            {PANTRY_STAPLES.map((staple) => {
              const selected = fridgeItems.includes(staple);
              return (
                <button
                  key={staple}
                  type="button"
                  onClick={() => (selected ? removeIngredient(staple) : addIngredient(staple))}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#1F5E43] border-[#1F5E43] text-white dark:bg-emerald-600 dark:border-emerald-600'
                      : 'bg-[#FAF9F6] dark:bg-[#141210] border-[#E6E1D6] dark:border-[#332E28] text-[#44403C] dark:text-[#D6D3CD] hover:border-[#1F5E43]'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 shrink-0" />}
                  <span>{staple}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Match Results */}
      {fridgeItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl">
          <p className="text-sm text-[#57534E] dark:text-[#A8A29E]">
            حداقل یک ماده اولیه انتخاب کنید تا دستورهای متناسب با یخچال شما نمایش داده شود.
          </p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl">
          <p className="text-sm text-[#57534E] dark:text-[#A8A29E]">
            هنوز دستوری با این ترکیب دقیق پیدا نشد. چند ماده پایه‌تر مثل تخم‌مرغ، آرد یا برنج اضافه کنید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(({recipe, matchedIngredients, missingIngredients, matchRatio}) => {
            const pct = Math.round(matchRatio * 100);
            return (
              <article
                key={recipe.id}
                className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl overflow-hidden flex flex-col justify-between p-5 gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-[#1C1917] dark:text-[#F5F2EB] leading-snug">
                      {recipe.title}
                    </h3>
                    <span className="text-sm font-bold text-[#1F5E43] dark:text-emerald-400 tabular-nums whitespace-nowrap shrink-0">
                      {toFaDigits(pct)}٪ تطبیق
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-[#EFECE4] dark:bg-[#2C2722] overflow-hidden">
                    <div
                      className="h-full bg-[#1F5E43] dark:bg-emerald-500 rounded-full"
                      style={{width: `${pct}%`}}
                    />
                  </div>

                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E] tabular-nums">
                    {toFaDigits(matchedIngredients.length)} از {toFaDigits(recipe.ingredients.length)} قلم در یخچال شما موجود است · زمان: {formatPrepTime(recipe.prepTime)}
                  </p>

                  <div className="space-y-1.5 text-xs">
                    <p className="text-[#1F5E43] dark:text-emerald-400 leading-5">
                      <span className="font-semibold">موجود: </span>
                      {matchedIngredients.join('، ')}
                    </p>
                    {missingIngredients.length > 0 && (
                      <p className="text-[#78716C] dark:text-[#A8A29E] leading-5">
                        <span className="font-semibold">نیاز به تهیه: </span>
                        {missingIngredients.join('، ')}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDetail(recipe)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#F2EFE9] hover:bg-[#E7E1D5] dark:bg-[#2A2520] dark:hover:bg-[#352F29] text-[#1C1917] dark:text-[#F5F2EB] transition-colors cursor-pointer"
                >
                  مشاهده کامل طرز تهیه
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
