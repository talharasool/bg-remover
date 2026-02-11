import { ImageSvg } from '../icons/Icons';

interface ProcessingViewProps {
  progress: number;
  status: string;
}

export default function ProcessingView({ progress, status }: ProcessingViewProps) {
  return (
    <div className="bg-surface rounded-3xl px-8 md:px-15 py-25 text-center border border-border">
      <div className="relative w-40 h-40 mx-auto mb-10">
        <div className="absolute inset-0 border-4 border-surface-light border-t-accent rounded-full animate-spin" />
        <div className="absolute inset-5 border-4 border-transparent border-b-accent-2 rounded-full animate-spin-reverse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 text-accent animate-pulse-scale"><ImageSvg /></span>
        </div>
      </div>
      <div className="text-[32px] font-semibold mb-4">Removing background...</div>
      <div className="text-base text-text-muted mb-10">{status}</div>
      <div className="max-w-[400px] mx-auto h-1.5 bg-surface-light rounded-sm overflow-hidden relative">
        <div
          className="progress-shimmer h-full bg-gradient-to-r from-accent to-accent-2 rounded-sm transition-[width] duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 text-sm text-text-muted tabular-nums">{Math.round(progress)}%</div>
    </div>
  );
}
