import { TwitterSvg, GithubSvg } from '../icons/Icons';

interface FooterMinimalProps {
  showSocial?: boolean;
}

export default function FooterMinimal({ showSocial = false }: FooterMinimalProps) {
  return (
    <footer className="pt-20 px-6 md:px-12 pb-10 border-t border-border bg-surface">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-text-muted">&copy; 2024 ClearCut Inc. All rights reserved.</div>
          {showSocial && (
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-surface-light rounded-[10px] flex items-center justify-center text-text-muted no-underline transition-all duration-300 hover:bg-accent hover:text-white hover:-translate-y-0.5"><TwitterSvg /></a>
              <a href="#" className="w-10 h-10 bg-surface-light rounded-[10px] flex items-center justify-center text-text-muted no-underline transition-all duration-300 hover:bg-accent hover:text-white hover:-translate-y-0.5"><GithubSvg /></a>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
