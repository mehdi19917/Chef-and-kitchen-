import {Download, Smartphone, X} from 'lucide-react';
import {useState} from 'react';
import {usePWAInstall} from '../hooks/usePWAInstall.ts';

export function PWAInstallButton() {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#1F5E43] hover:bg-[#184B35] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>نصب اپلیکیشن (PWA)</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium border border-[#DDD6C8] dark:border-[#36302A] bg-white dark:bg-[#24201C] text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#1F5E43] transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Smartphone className="w-4 h-4 text-[#1F5E43] dark:text-emerald-400 shrink-0" />
        <span>نصب روی گوشی (PWA)</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="راهنمای نصب اپلیکیشن وب پخت‌نگار"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                نصب پخت‌نگار روی صفحه اصلی گوشی
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="بستن"
                className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-sm text-[#44403C] dark:text-[#D6D3CD] leading-7 list-decimal list-inside">
                <li>صفحه را در مرورگر <strong>Safari</strong> باز کنید.</li>
                <li>دکمه <strong>اشتراک‌گذاری (Share)</strong> در نوار پایین صفحه را لمس کنید.</li>
                <li>گزینه <strong>Add to Home Screen</strong> را بزنید تا آیکون پخت‌نگار مثل یک اپ مستقل نصب شود.</li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-sm text-[#44403C] dark:text-[#D6D3CD] leading-7 list-decimal list-inside">
                <li>لینک مستقیم پخت‌نگار را در مرورگر Chrome یا Edge باز کنید (خارج از قاب پیش‌نمایش).</li>
                <li>منوی سه‌نقطه مرورگر را باز کنید و گزینه <strong>نصب برنامه / Install app</strong> یا <strong>Add to Home screen</strong> را بزنید.</li>
                <li>پخت‌نگار با آیکون اختصاصی و پشتیبانی آفلاین روی گوشی یا دسکتاپ شما نصب می‌شود.</li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
}
