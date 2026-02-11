import { WarningSvg } from '../icons/Icons';

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div className="text-center px-8 md:px-15 py-25 bg-surface rounded-3xl border border-border">
      <div className="w-20 h-20 mx-auto mb-8 bg-accent/10 rounded-3xl flex items-center justify-center animate-shake">
        <span className="w-10 h-10 text-accent"><WarningSvg /></span>
      </div>
      <div className="text-[28px] font-semibold mb-3">Something went wrong</div>
      <div className="text-text-muted mb-8">{message}</div>
      <button
        className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-[10px] border-none bg-accent text-white cursor-pointer transition-all duration-300 ease-bounce hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--color-accent-glow)] font-[inherit]"
        onClick={onRetry}
      >
        Try Again
      </button>
    </div>
  );
}
