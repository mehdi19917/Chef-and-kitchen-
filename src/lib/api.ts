import type {Recipe, RecipeCategory, RecipeDifficulty, StorageStats, User} from '../types.ts';

let memoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  memoryToken = token;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (memoryToken) {
    headers.set('Authorization', `Bearer ${memoryToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = (await res.json().catch(() => ({}))) as T & {error?: string};
  if (!res.ok) {
    throw new Error(data.error || 'خطا در ارتباط با سرور');
  }
  return data;
}

export async function fetchMe(): Promise<{user: User | null}> {
  return apiFetch('/api/auth/me');
}

export async function fetchStorageStats(): Promise<{storage: StorageStats}> {
  return apiFetch('/api/storage/stats');
}

export async function registerUser(username: string, password: string): Promise<{user: User; token: string}> {
  const data = await apiFetch<{user: User; token: string}>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({username, password}),
  });
  setAuthToken(data.token);
  return data;
}

export async function loginUser(username: string, password: string): Promise<{user: User; token: string}> {
  const data = await apiFetch<{user: User; token: string}>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({username, password}),
  });
  setAuthToken(data.token);
  return data;
}

export async function logoutUser(): Promise<void> {
  await apiFetch('/api/auth/logout', {method: 'POST'});
  setAuthToken(null);
}

export interface RecipeQueryParams {
  q?: string;
  category?: RecipeCategory | 'all';
  difficulty?: RecipeDifficulty | 'all';
  timeRange?: 'all' | 'quick' | 'medium' | 'long';
  vegetarian?: boolean;
  diet?: boolean;
}

export async function fetchRecipes(params: RecipeQueryParams = {}): Promise<{recipes: Recipe[]}> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.difficulty && params.difficulty !== 'all') qs.set('difficulty', params.difficulty);
  if (params.timeRange === 'quick') qs.set('maxTime', '30');
  if (params.timeRange === 'medium') {
    qs.set('minTime', '31');
    qs.set('maxTime', '60');
  }
  if (params.timeRange === 'long') qs.set('minTime', '61');
  if (params.vegetarian) qs.set('vegetarian', 'true');
  if (params.diet) qs.set('diet', 'true');

  const query = qs.toString();
  return apiFetch(`/api/recipes${query ? `?${query}` : ''}`);
}

export async function fetchRecipeDetail(id: number): Promise<{recipe: Recipe}> {
  return apiFetch(`/api/recipes/${id}`);
}

export interface CreateRecipePayload {
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
  ingredients: Array<{name: string; amount: string}>;
  steps: Array<{title: string; instruction: string; tip?: string}>;
}

export async function createRecipe(payload: CreateRecipePayload): Promise<{recipe: Recipe}> {
  return apiFetch('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function uploadVideoFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{videoUrl: string; videoSizeBytes: number; storage: StorageStats}> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos/upload', true);
    xhr.withCredentials = true;

    const mimeType =
      file.type && ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type.toLowerCase())
        ? file.type.toLowerCase()
        : file.name.toLowerCase().endsWith('.webm')
          ? 'video/webm'
          : file.name.toLowerCase().endsWith('.mov')
            ? 'video/quicktime'
            : 'video/mp4';

    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (memoryToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${memoryToken}`);
    }

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(parsed);
        } else {
          reject(new Error(parsed.error || 'خطا در آپلود ویدیو'));
        }
      } catch {
        reject(new Error('پاسخ نامعتبر از سرور هنگام آپلود ویدیو'));
      }
    };

    xhr.onerror = () => reject(new Error('اختلال شبکه هنگام آپلود ویدیو'));
    xhr.send(file);
  });
}

export async function attachRecipeVideo(
  id: number,
  videoUrl: string | null,
  videoSizeBytes: number | null,
): Promise<{recipe: Recipe}> {
  return apiFetch(`/api/recipes/${id}/video`, {
    method: 'PATCH',
    body: JSON.stringify({videoUrl, videoSizeBytes}),
  });
}

export async function deleteRecipe(id: number): Promise<void> {
  await apiFetch(`/api/recipes/${id}`, {method: 'DELETE'});
}

export async function rateRecipe(id: number, score: number): Promise<{recipe: Recipe}> {
  return apiFetch(`/api/recipes/${id}/rate`, {
    method: 'POST',
    body: JSON.stringify({score}),
  });
}

export async function toggleFavoriteRecipe(id: number): Promise<{isFavorite: boolean}> {
  return apiFetch(`/api/recipes/${id}/favorite`, {
    method: 'POST',
  });
}

export async function fetchProfile(): Promise<{user: User; favorites: Recipe[]; authored: Recipe[]}> {
  return apiFetch('/api/profile');
}
