import type {FridgeMatchResult, Recipe} from '../types.ts';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFaDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function formatPrepTime(minutes: number): string {
  if (minutes < 60) {
    return `${toFaDigits(minutes)} دقیقه`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${toFaDigits(hrs)} ساعت`;
  }
  return `${toFaDigits(hrs)} ساعت و ${toFaDigits(mins)} دقیقه`;
}

export function formatBytesFa(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${toFaDigits(Math.max(1, Math.round(bytes / 1024)))} کیلوبایت`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${toFaDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  }
  return `${toFaDigits((bytes / (1024 * 1024 * 1024)).toFixed(2))} گیگابایت`;
}

export function normalizePersianText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\s]+/g, ' ');
}

export function matchRecipesWithFridge(recipes: Recipe[], fridgeItems: string[]): FridgeMatchResult[] {
  const normalizedFridge = fridgeItems.map(normalizePersianText).filter(Boolean);
  if (normalizedFridge.length === 0) return [];

  const results: FridgeMatchResult[] = [];
  for (const recipe of recipes) {
    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];

    for (const ing of recipe.ingredients) {
      const ingNorm = normalizePersianText(ing.name);
      const isMatch = normalizedFridge.some(
        (f) => ingNorm.includes(f) || f.includes(ingNorm) || f.split(' ').some((word) => word.length > 2 && ingNorm.includes(word)),
      );
      if (isMatch) {
        matchedIngredients.push(ing.name);
      } else {
        missingIngredients.push(ing.name);
      }
    }

    if (matchedIngredients.length > 0) {
      const total = Math.max(1, recipe.ingredients.length);
      results.push({
        recipe,
        matchedIngredients,
        missingIngredients,
        matchRatio: matchedIngredients.length / total,
      });
    }
  }

  return results.sort((a, b) => {
    if (b.matchRatio !== a.matchRatio) return b.matchRatio - a.matchRatio;
    return b.matchedIngredients.length - a.matchedIngredients.length;
  });
}

export function buildShareText(recipe: Recipe): string {
  const lines = [
    `دستور پخت: ${recipe.title}`,
    `زمان آماده‌سازی: ${formatPrepTime(recipe.prepTime)}`,
    `امتیاز: ${toFaDigits(recipe.avgRating || 5)} از ۵`,
    '',
    'مواد اولیه:',
    ...recipe.ingredients.slice(0, 8).map((i) => `• ${i.name}: ${i.amount}`),
    '',
    'منتشرشده در پخت‌نگار (جامعه آشپزی، کیک‌پزی و نان‌پزی)',
  ];
  return lines.join('\n');
}
