export type RecipeCategory = 'cooking' | 'cake' | 'bread' | 'dessert';
export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export interface IngredientItem {
  name: string;
  amount: string;
}

export interface RecipeStep {
  title: string;
  instruction: string;
  tip?: string;
}

export interface Recipe {
  id: number;
  authorId: number;
  authorUsername: string;
  title: string;
  description: string;
  category: RecipeCategory;
  prepTime: number;
  difficulty: RecipeDifficulty;
  servings: number;
  calories: number | null;
  isVegetarian: boolean;
  isDiet: boolean;
  imageUrl: string;
  videoUrl: string | null;
  videoSizeBytes: number | null;
  ingredients: IngredientItem[];
  steps: RecipeStep[];
  avgRating: number;
  ratingCount: number;
  isFavorite?: boolean;
  userRating?: number | null;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
}

export interface FridgeMatchResult {
  recipe: Recipe;
  matchedIngredients: string[];
  missingIngredients: string[];
  matchRatio: number;
}

export interface StorageStats {
  maxVideoBytes: number;
  totalQuotaBytes: number;
  usedBytes: number;
  remainingBytes: number;
  videoCount: number;
}

export const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  cooking: 'آشپزی و غذای اصلی',
  cake: 'کیک و شیرینی',
  bread: 'نان‌پزی و خمیر',
  dessert: 'دسر و پیش‌غذا',
};

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  easy: 'آسان',
  medium: 'متوسط',
  hard: 'حرفه‌ای',
};
