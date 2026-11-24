import {WifiOff} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {AuthModal} from './components/AuthModal.tsx';
import {CreateRecipeModal} from './components/CreateRecipeModal.tsx';
import {FilterToolbar, type FilterState} from './components/FilterToolbar.tsx';
import {FridgeSearchPanel} from './components/FridgeSearchPanel.tsx';
import {Header, type NavTab} from './components/Header.tsx';
import {KitchenHero} from './components/KitchenHero.tsx';
import {ProfileView} from './components/ProfileView.tsx';
import {RecipeCard} from './components/RecipeCard.tsx';
import {RecipeDetailModal} from './components/RecipeDetailModal.tsx';
import {ShareModal} from './components/ShareModal.tsx';
import {ShortVideoSection} from './components/ShortVideoSection.tsx';
import {VideoPlayerModal} from './components/VideoPlayerModal.tsx';
import {useOnlineStatus} from './hooks/useOnlineStatus.ts';
import {fetchMe, fetchRecipes, fetchStorageStats, logoutUser, toggleFavoriteRecipe} from './lib/api.ts';
import {toFaDigits} from './lib/format.ts';
import type {Recipe, StorageStats, User} from './types.ts';

const INITIAL_FILTERS: FilterState = {
  q: '',
  category: 'all',
  difficulty: 'all',
  timeRange: 'all',
  vegetarian: false,
  diet: false,
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    return 'light';
  });
  const [activeTab, setActiveTab] = useState<NavTab>('explore');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<'create' | null>(null);

  const [detailRecipeId, setDetailRecipeId] = useState<number | null>(null);
  const [videoRecipe, setVideoRecipe] = useState<Recipe | null>(null);
  const [shareRecipe, setShareRecipe] = useState<Recipe | null>(null);
  const [profileRefresh, setProfileRefresh] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const isOnline = useOnlineStatus();

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('pokhtnegar_theme', theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const refreshStorage = useCallback(async () => {
    try {
      const res = await fetchStorageStats();
      setStorage(res.storage);
    } catch {
      // Ignore transient errors
    }
  }, []);

  const loadAllRecipes = useCallback(async () => {
    try {
      const res = await fetchRecipes({});
      setAllRecipes(res.recipes);
    } catch {
      // Ignore transient errors
    }
  }, []);

  const loadFilteredRecipes = useCallback(async (f: FilterState) => {
    setLoading(true);
    try {
      const res = await fetchRecipes({
        q: f.q,
        category: f.category,
        difficulty: f.difficulty,
        timeRange: f.timeRange,
        vegetarian: f.vegetarian,
        diet: f.diet,
      });
      setRecipes(res.recipes);
    } catch {
      // Keep existing state on transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe()
      .then((res) => setUser(res.user))
      .catch(() => {});
    refreshStorage();

    const params = new URLSearchParams(window.location.search);
    const sharedId = Number(params.get('recipe'));
    if (Number.isInteger(sharedId) && sharedId > 0) {
      setDetailRecipeId(sharedId);
    }
  }, [refreshStorage]);

  useEffect(() => {
    loadAllRecipes();
  }, [loadAllRecipes, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadFilteredRecipes(filters);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [filters, loadFilteredRecipes, user]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenCreate = () => {
    if (!user) {
      setPendingActionAfterAuth('create');
      setAuthModalOpen(true);
      return;
    }
    setCreateModalOpen(true);
  };

  const handleAuthenticated = (authedUser: User) => {
    setUser(authedUser);
    setProfileRefresh((n) => n + 1);
    showToast(`خوش آمدید @${authedUser.username}`);
    if (pendingActionAfterAuth === 'create') {
      setPendingActionAfterAuth(null);
      setCreateModalOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore logout network error
    }
    setUser(null);
    setProfileRefresh((n) => n + 1);
    showToast('از حساب کاربری خارج شدید.');
  };

  const handleToggleFavorite = async (recipe: Recipe) => {
    if (!user) {
      setAuthModalOpen(true);
      showToast('برای ذخیره در علاقه‌مندی‌ها ابتدا با نام کاربری وارد شوید.');
      return;
    }
    try {
      const res = await toggleFavoriteRecipe(recipe.id);
      const updateList = (list: Recipe[]) =>
        list.map((r) => (r.id === recipe.id ? {...r, isFavorite: res.isFavorite} : r));
      setRecipes(updateList);
      setAllRecipes(updateList);
      setProfileRefresh((n) => n + 1);
      showToast(res.isFavorite ? 'به لیست علاقه‌مندی‌ها اضافه شد.' : 'از لیست علاقه‌مندی‌ها حذف شد.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در ذخیره علاقه‌مندی');
    }
  };

  const handleRecipeCreated = (created: Recipe, updatedStorage?: StorageStats) => {
    setRecipes((prev) => [created, ...prev]);
    setAllRecipes((prev) => [created, ...prev]);
    if (updatedStorage) {
      setStorage(updatedStorage);
    } else {
      refreshStorage();
    }
    setProfileRefresh((n) => n + 1);
    setActiveTab('explore');
    showToast('دستور پخت شما با موفقیت منتشر شد!');
  };

  const handleRecipeUpdated = (updated: Recipe, updatedStorage?: StorageStats) => {
    const patch = (list: Recipe[]) => list.map((r) => (r.id === updated.id ? {...r, ...updated} : r));
    setRecipes(patch);
    setAllRecipes(patch);
    if (updatedStorage) {
      setStorage(updatedStorage);
    }
    setProfileRefresh((n) => n + 1);
  };

  const handleRecipeDeleted = (id: number) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setAllRecipes((prev) => prev.filter((r) => r.id !== id));
    refreshStorage();
    setProfileRefresh((n) => n + 1);
    showToast('دستور پخت حذف شد.');
  };

  const selectedDetailInitial =
    recipes.find((r) => r.id === detailRecipeId) ?? allRecipes.find((r) => r.id === detailRecipeId) ?? null;

  const realVideoCount = allRecipes.filter((r) => Boolean(r.videoUrl)).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#141210] text-[#1C1917] dark:text-[#F5F2EB]">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} onOpenCreate={handleOpenCreate} />

      <main className="flex-1">
        <KitchenHero
          user={user}
          theme={theme}
          recipeCount={allRecipes.length}
          videoCount={realVideoCount}
          onToggleTheme={handleToggleTheme}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          onGoFridge={() => setActiveTab('fridge')}
          onGoVideos={() => setActiveTab('videos')}
          onOpenProfile={() => setActiveTab('profile')}
        />

        {activeTab === 'explore' && (
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
            <FilterToolbar
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(INITIAL_FILTERS)}
            />

            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                دستورهای آشپزی، کیک‌پزی و نان‌پزی
              </h2>
              <span className="text-xs text-[#78716C] dark:text-[#A8A29E] tabular-nums">
                {toFaDigits(recipes.length)} نتیجه
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-80 rounded-2xl border border-[#E6E1D6] dark:border-[#332E28] bg-white dark:bg-[#1E1B18] animate-pulse"
                  />
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <div className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-10 text-center space-y-3">
                <p className="text-sm text-[#57534E] dark:text-[#A8A29E]">
                  هیچ دستوری با فیلترهای انتخابی پیدا نشد. می‌توانید فیلترها را بازنشانی کنید یا اولین دستور را ثبت کنید.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(INITIAL_FILTERS)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#F2EFE9] dark:bg-[#26221E] text-[#1C1917] dark:text-[#F5F2EB] cursor-pointer"
                >
                  نمایش همه دستورها
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onOpenDetail={(r) => setDetailRecipeId(r.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenVideo={(r) => setVideoRecipe(r)}
                    onShare={(r) => setShareRecipe(r)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'fridge' && (
          <FridgeSearchPanel recipes={allRecipes} onOpenDetail={(r) => setDetailRecipeId(r.id)} />
        )}

        {activeTab === 'videos' && (
          <ShortVideoSection
            recipes={allRecipes}
            storage={storage}
            onPlayVideo={(r) => setVideoRecipe(r)}
            onOpenDetail={(r) => setDetailRecipeId(r.id)}
            onOpenCreate={handleOpenCreate}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            refreshTrigger={profileRefresh}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenCreate={handleOpenCreate}
            onOpenDetail={(r) => setDetailRecipeId(r.id)}
            onToggleFavorite={handleToggleFavorite}
            onOpenVideo={(r) => setVideoRecipe(r)}
            onShare={(r) => setShareRecipe(r)}
          />
        )}
      </main>

      <footer className="border-t border-[#E6E1D6] dark:border-[#2E2924] bg-[#F5F2EB] dark:bg-[#1A1714] mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#57534E] dark:text-[#A8A29E]">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg text-[#1C1917] dark:text-[#F5F2EB]">پخت‌نگار</span>
            <span aria-hidden="true">·</span>
            <span>فضای آزاد و بی‌حاشیه برای دستورهای آشپزی، کیک‌پزی و نان‌پزی</span>
          </div>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => setActiveTab('explore')} className="hover:underline cursor-pointer">
              کاوش دستورها
            </button>
            <button type="button" onClick={() => setActiveTab('fridge')} className="hover:underline cursor-pointer">
              یخچال من
            </button>
            <button type="button" onClick={() => setActiveTab('videos')} className="hover:underline cursor-pointer">
              ویدیوهای واقعی
            </button>
            <button type="button" onClick={handleToggleTheme} className="hover:underline cursor-pointer">
              {theme === 'dark' ? 'مود روشن' : 'مود تیره'}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        open={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingActionAfterAuth(null);
        }}
        onAuthenticated={handleAuthenticated}
      />

      <CreateRecipeModal
        open={createModalOpen}
        storage={storage}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleRecipeCreated}
      />

      <RecipeDetailModal
        recipeId={detailRecipeId}
        initialRecipe={selectedDetailInitial}
        user={user}
        onClose={() => setDetailRecipeId(null)}
        onRequireAuth={() => setAuthModalOpen(true)}
        onToggleFavorite={handleToggleFavorite}
        onOpenVideo={(r) => setVideoRecipe(r)}
        onShare={(r) => setShareRecipe(r)}
        onRecipeUpdated={handleRecipeUpdated}
        onRecipeDeleted={handleRecipeDeleted}
      />

      <VideoPlayerModal
        recipe={videoRecipe}
        onClose={() => setVideoRecipe(null)}
        onOpenRecipeDetail={(r) => {
          setVideoRecipe(null);
          setDetailRecipeId(r.id);
        }}
      />

      <ShareModal recipe={shareRecipe} onClose={() => setShareRecipe(null)} />

      {!isOnline && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>حالت آفلاین — دستورهای کش‌شده در دسترس هستند</span>
        </div>
      )}

      {/* Feedback Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-5 z-50 px-4 py-2.5 rounded-xl bg-[#1C1917] dark:bg-[#F5F2EB] text-white dark:text-[#141210] text-xs sm:text-sm font-medium shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
