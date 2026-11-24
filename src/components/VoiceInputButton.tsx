import {Mic, MicOff} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';

type SpeechAlternative = {transcript: string};
type SpeechResult = {0?: SpeechAlternative};
type SpeechEvent = {resultIndex: number; results: ArrayLike<SpeechResult>};
type SpeechErrorEvent = {error?: string};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

interface VoiceInputButtonProps {
  onText: (text: string) => void;
  className?: string;
}

export function VoiceInputButton({onText, className = ''}: VoiceInputButtonProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => () => {
    recognitionRef.current?.stop();
  }, []);

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setMessage('مرورگر شما تایپ صوتی را پشتیبانی نمی‌کند؛ از Chrome استفاده کنید.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'fa-IR';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const chunks: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i]?.[0]?.transcript;
        if (transcript) chunks.push(transcript);
      }
      if (chunks.length) onText(chunks.join(' '));
    };
    recognition.onerror = (event) => {
      setMessage(event.error === 'not-allowed' ? 'اجازه میکروفون را از تنظیمات مرورگر فعال کنید.' : 'تشخیص صدا متوقف شد؛ دوباره تلاش کنید.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setMessage('');
    try {
      recognition.start();
      setListening(true);
    } catch {
      setMessage('شروع تایپ صوتی ممکن نشد؛ دوباره تلاش کنید.');
      setListening(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={toggle} aria-pressed={listening}
        className={className || 'inline-flex items-center gap-1 rounded-lg border border-[#DDD6C8] dark:border-[#36302A] px-2.5 py-1.5 text-xs cursor-pointer'}>
        {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        {listening ? 'توقف گفتار' : 'تایپ صوتی'}
      </button>
      {message && <span role="status" className="text-[11px] text-amber-700 dark:text-amber-400">{message}</span>}
    </span>
  );
}
