import {X} from 'lucide-react';
import {formatBytesFa, toFaDigits} from '../lib/format.ts';
import type {Recipe} from '../types.ts';

interface VideoPlayerModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onOpenRecipeDetail: (recipe: Recipe) => void;
}

export function VideoPlayerModal({recipe, onClose, onOpenRecipeDetail}: VideoPlayerModalProps) {
  if (!recipe || !recipe.videoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`ویدیوی آموزشی ${recipe.title}`}
    >
      <div className="w-full max-w-4xl bg-[#181512] text-[#F5F2EB] border border-[#332E28] rounded-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#2E2924] flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-amber-400">
              ویدیوی واقعی آشپزی · @{recipe.authorUsername}
              {recipe.videoSizeBytes ? ` · ${formatBytesFa(recipe.videoSizeBytes)}` : ''}
            </p>
            <h3 className="text-sm sm:text-base font-semibold truncate">{recipe.title}</h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenRecipeDetail(recipe)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#3B352E] hover:border-amber-500 text-[#E7E2D8] transition-colors cursor-pointer whitespace-nowrap"
            >
              متن کامل دستور
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن ویدیو"
              className="p-2 rounded-lg bg-[#26221E] hover:bg-[#332E28] text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real HTML5 Video Player + Steps Reference */}
        <div className="overflow-y-auto flex-1">
          <div className="bg-black aspect-video w-full">
            <video
              key={recipe.videoUrl}
              src={recipe.videoUrl}
              poster={recipe.imageUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
          </div>

          {recipe.steps.length > 0 && (
            <div className="p-4 sm:p-6 space-y-3 bg-[#1E1B18] border-t border-[#2E2924]">
              <h4 className="text-sm font-bold text-amber-300">خلاصه مراحل همزمان با ویدیو:</h4>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipe.steps.map((step, idx) => (
                  <li key={`${step.title}-${idx}`} className="p-3 rounded-xl bg-[#141210] border border-[#2E2924] text-xs space-y-1">
                    <p className="font-semibold text-white">
                      {toFaDigits(idx + 1)}. {step.title}
                    </p>
                    <p className="text-[#B8B2A8] leading-5">{step.instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
