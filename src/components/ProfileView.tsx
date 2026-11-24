import {Bookmark, ChefHat, Plus, User as UserIcon} from 'lucide-react';
import {useEffect, useState} from 'react';
import {fetchProfile} from '../lib/api.ts';
import {toFaDigits} from '../lib/format.ts';
import type {Recipe, User} from '../types.ts';
import {RecipeCard} from './RecipeCard.tsx';

interface ProfileViewProps {
  user: User | null;
  refreshTrigger: number;
  onOpenAuth: () => void;
  onOpenCreate: () => void;
  onOpenDetail: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onOpenVideo: (recipe: Recipe) => void;
  onShare: (recipe: Recipe) => void;
}

export function ProfileView({
  user,
  refreshTrigger,
  onOpenAuth,
  onOpenCreate,
  onOpenDetail,
  onToggleFavorite,
  onOpenVideo,
  onShare,
}: ProfileViewProps) {
  const [subTab, setSubTab] = useState<'favorites' | 'authored'>('favorites');
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [authored, setAuthored] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setAuthored([]);
      return;
    }
    let active = true;
    setLoading(true);
    fetchProfile()
      .then((res) => {
        if (!active) return;
        setFavorites(res.favorites);
        setAuthored(res.authored);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, refreshTrigger]);

  if (!user) {
    return (
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] dark:bg-[#26221E] flex items-center justify-center mx-auto text-[#C25E00] dark:text-amber-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            پروفایل و لیست دستورهای مورد علاقه
          </h2>
          <p className="text-sm text-[#57534E] dark:text-[#A8A29E] leading-7">
            برای ذخیره دستورهای محبوب خود در لیست علاقه‌مندی‌ها و مدیریت دستورهایی که ثبت کرده‌اید، فقط با یک نام کاربری ساده وارد شوید.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
            <span>ورود یا ثبت‌نام سریع</span>
          </button>
        </div>
      </section>
    );
  }

  const activeList = subTab === 'favorites' ? favorites : authored;

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F2EFE9] dark:bg-[#26221E] flex items-center justify-center text-[#C25E00] dark:text-amber-400 font-bold text-lg">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB]" dir="ltr">
              @{user.username}
            </h2>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] tabular-nums mt-0.5">
              {toFaDigits(favorites.length)} دستور ذخیره‌شده · {toFaDigits(authored.length)} دستور ثبت‌شده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#F2EFE9] dark:bg-[#141210] self-start sm:self-center">
          <button
            type="button"
            onClick={() => setSubTab('favorites')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              subTab === 'favorites'
                ? 'bg-white dark:bg-[#2A2520] text-[#1C1917] dark:text-[#F5F2EB] font-semibold'
                : 'text-[#57534E] dark:text-[#A8A29E]'
            }`}
          >
            <Bookmark className="w-4 h-4 shrink-0" />
            <span>علاقه‌مندی‌ها ({toFaDigits(favorites.length)})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('authored')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              subTab === 'authored'
                ? 'bg-white dark:bg-[#2A2520] text-[#1C1917] dark:text-[#F5F2EB] font-semibold'
                : 'text-[#57534E] dark:text-[#A8A29E]'
            }`}
          >
            <ChefHat className="w-4 h-4 shrink-0" />
            <span>دستورهای من ({toFaDigits(authored.length)})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[#78716C] dark:text-[#A8A29E]">در حال بارگذاری پروفایل...</div>
      ) : activeList.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm text-[#57534E] dark:text-[#A8A29E]">
            {subTab === 'favorites'
              ? 'هنوز هیچ دستوری را به لیست علاقه‌مندی‌ها اضافه نکرده‌اید. روی آیکون نشانک کنار هر دستور کلیک کنید تا اینجا ذخیره شود.'
              : 'هنوز دستوری ثبت نکرده‌اید. اولین ایده آشپزی، کیک یا نان خود را منتشر کنید!'}
          </p>
          {subTab === 'authored' && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت اولین دستور</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeList.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpenDetail={onOpenDetail}
              onToggleFavorite={onToggleFavorite}
              onOpenVideo={onOpenVideo}
              onShare={onShare}
            />
          ))}
        </div>
      )}
    </section>
  );
}
