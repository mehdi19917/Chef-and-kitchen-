import {ShieldCheck, UserPlus, X} from 'lucide-react';
import {useState, type FormEvent} from 'react';
import {loginUser, registerUser} from '../lib/api.ts';
import type {User} from '../types.ts';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export function AuthModal({open, onClose, onAuthenticated}: AuthModalProps) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === 'register'
          ? await registerUser(username, password)
          : await loginUser(username, password);
      onAuthenticated(res.user);
      setUsername('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="ورود یا ثبت‌نام با نام کاربری"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB] flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#C25E00] dark:text-amber-400" />
            <span>{mode === 'register' ? 'ثبت‌نام فقط با نام کاربری' : 'ورود به حساب کاربری'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F2EFE9] dark:bg-[#141210]">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-[#2A2520] text-[#1C1917] dark:text-[#F5F2EB] font-semibold'
                : 'text-[#57534E] dark:text-[#A8A29E]'
            }`}
          >
            ساخت حساب جدید
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-[#2A2520] text-[#1C1917] dark:text-[#F5F2EB] font-semibold'
                : 'text-[#57534E] dark:text-[#A8A29E]'
            }`}
          >
            قبلاً ثبت‌نام کرده‌ام
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F5F2EB] dark:bg-[#24201C] text-xs text-[#57534E] dark:text-[#B8B2A8] leading-5">
          <ShieldCheck className="w-4 h-4 text-[#1F5E43] dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            در پخت‌نگار نیازی به وارد کردن نام، نام خانوادگی، ایمیل یا شماره موبایل نیست. فقط یک نام کاربری دلخواه و رمز عبور ساده انتخاب کنید.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-username" className="block text-xs font-medium text-[#44403C] dark:text-[#D6D3CD] mb-1.5">
              نام کاربری ساده (حداقل ۳ کاراکتر)
            </label>
            <input
              id="auth-username"
              type="text"
              required
              minLength={3}
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثلاً: ashpaaz_bahar"
              dir="auto"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210] text-[#1C1917] dark:text-[#F5F2EB] focus:outline-none focus:border-[#C25E00]"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-[#44403C] dark:text-[#D6D3CD] mb-1.5">
              رمز عبور (حداقل ۴ کاراکتر برای حفاظت از لیست علاقه‌مندی‌ها)
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={4}
              maxLength={64}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DDD6C8] dark:border-[#36302A] bg-[#FAF9F6] dark:bg-[#141210] text-[#1C1917] dark:text-[#F5F2EB] focus:outline-none focus:border-[#C25E00]"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'در حال پردازش...' : mode === 'register' ? 'ساخت حساب و ورود' : 'ورود به پخت‌نگار'}
          </button>
        </form>
      </div>
    </div>
  );
}
