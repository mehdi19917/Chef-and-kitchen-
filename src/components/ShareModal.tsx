import {Check, Copy, Share2, X} from 'lucide-react';
import {useState} from 'react';
import {buildShareText} from '../lib/format.ts';
import type {Recipe} from '../types.ts';

interface ShareModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export function ShareModal({recipe, onClose}: ShareModalProps) {
  const [copiedType, setCopiedType] = useState<'link' | 'text' | null>(null);

  if (!recipe) return null;

  const shareUrl = `${window.location.origin}/?recipe=${recipe.id}`;
  const shareText = buildShareText(recipe);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${recipe.title}\n${shareUrl}`);
  const encodedFull = encodeURIComponent(`${shareText}\n\n${shareUrl}`);

  const copyToClipboard = async (value: string, type: 'link' | 'text') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedType(type);
      window.setTimeout(() => setCopiedType(null), 2200);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="اشتراک‌گذاری دستور پخت"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#1E1B18] border border-[#E6E1D6] dark:border-[#332E28] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#C25E00] dark:text-amber-400" />
            <span>اشتراک‌گذاری در شبکه‌های اجتماعی</span>
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

        <p className="text-sm text-[#57534E] dark:text-[#A8A29E] line-clamp-2">{recipe.title}</p>

        {/* Social Platform Links */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(recipe.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-[#0088CC]/10 text-[#0077B5] dark:text-[#38BDF8] border border-[#0088CC]/25 hover:bg-[#0088CC]/20 transition-colors"
          >
            <span>تلگرام</span>
          </a>

          <a
            href={`https://api.whatsapp.com/send?text=${encodedFull}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-[#25D366]/10 text-[#15803D] dark:text-[#4ADE80] border border-[#25D366]/25 hover:bg-[#25D366]/20 transition-colors"
          >
            <span>واتساپ</span>
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-[#1C1917]/5 dark:bg-white/10 text-[#1C1917] dark:text-[#F5F2EB] border border-[#DDD6C8] dark:border-[#36302A] hover:border-[#C25E00] transition-colors"
          >
            <span>ایکس (توییتر)</span>
          </a>

          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-[#0A66C2]/10 text-[#0A66C2] dark:text-[#60A5FA] border border-[#0A66C2]/25 hover:bg-[#0A66C2]/20 transition-colors"
          >
            <span>لینکدین</span>
          </a>
        </div>

        {/* Copy Actions */}
        <div className="space-y-2.5 pt-2 border-t border-[#EEEAE0] dark:border-[#2C2722]">
          <button
            type="button"
            onClick={() => copyToClipboard(shareUrl, 'link')}
            className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium bg-[#FAF9F6] dark:bg-[#141210] border border-[#DDD6C8] dark:border-[#36302A] hover:border-[#C25E00] transition-colors cursor-pointer"
          >
            <span className="truncate text-[#57534E] dark:text-[#A8A29E]" dir="ltr">
              {shareUrl}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#C25E00] dark:text-amber-400 font-semibold shrink-0 mr-2">
              {copiedType === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedType === 'link' ? 'کپی شد' : 'کپی لینک'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(`${shareText}\n${shareUrl}`, 'text')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#C25E00] hover:bg-[#A64E00] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#141210] transition-colors cursor-pointer"
          >
            {copiedType === 'text' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>
              {copiedType === 'text'
                ? 'متن کامل دستور کپی شد'
                : 'کپی متن کامل برای اینستاگرام و پیام‌رسان‌ها'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
