import { LogoSvg } from '../icons/Icons';

type PageName = 'home' | 'pricing' | 'api';

interface NavbarProps {
  currentPage: PageName;
  navigate: (page: PageName) => void;
}

export default function Navbar({ currentPage, navigate }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 md:px-12 md:py-5 flex justify-between items-center bg-bg/80 backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-border">
      <div
        className="text-2xl font-bold flex items-center gap-3 cursor-pointer text-text"
        onClick={() => navigate('home')}
      >
        <div className="logo-shine w-9 h-9 bg-gradient-to-br from-accent to-[#ff6b6b] rounded-[10px] flex items-center justify-center">
          <span className="relative z-1 text-white w-5 h-5"><LogoSvg /></span>
        </div>
        ClearCut
      </div>
      <div className="hidden md:flex items-center gap-2">
        <span
          className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-300 ease-smooth ${currentPage === 'home' ? 'text-text bg-surface-light' : 'text-text-muted hover:text-text hover:bg-surface'}`}
          onClick={() => navigate('home')}
        >
          Product
        </span>
        <span
          className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-300 ease-smooth ${currentPage === 'pricing' ? 'text-text bg-surface-light' : 'text-text-muted hover:text-text hover:bg-surface'}`}
          onClick={() => navigate('pricing')}
        >
          Pricing
        </span>
        <span
          className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-300 ease-smooth ${currentPage === 'api' ? 'text-text bg-surface-light' : 'text-text-muted hover:text-text hover:bg-surface'}`}
          onClick={() => navigate('api')}
        >
          API
        </span>
        <button
          className="ml-4 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-all duration-300 ease-bounce hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--color-accent-glow)]"
          onClick={() => navigate('pricing')}
        >
          Get Started
        </button>
      </div>
    </nav>
  );
}
