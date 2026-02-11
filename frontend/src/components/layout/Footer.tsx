import { LogoSvg, TwitterSvg, GithubSvg, LinkedInSvg } from '../icons/Icons';

type PageName = 'home' | 'pricing' | 'api';

interface FooterProps {
  navigate: (page: PageName) => void;
}

export default function Footer({ navigate }: FooterProps) {
  return (
    <footer className="mt-20 pt-20 px-6 md:px-12 pb-10 border-t border-border bg-surface">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-12 mb-15">
          <div className="max-w-[280px]">
            <div className="flex items-center gap-3 mb-4 text-2xl font-bold">
              <div className="logo-shine w-8 h-8 bg-gradient-to-br from-accent to-[#ff6b6b] rounded-[10px] flex items-center justify-center">
                <span className="relative z-1 text-white w-5 h-5"><LogoSvg /></span>
              </div>
              ClearCut
            </div>
            <p className="text-sm text-text-muted leading-relaxed mb-6">Professional background removal powered by AI. Fast, accurate, and privacy-focused.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 bg-bg border border-border rounded-lg text-text text-sm outline-none transition-colors duration-300 focus:border-accent font-[inherit]" />
              <button className="px-5 py-3 bg-accent text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_var(--color-accent-glow)] font-[inherit]">Subscribe</button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.05em] mb-5 text-text-muted">Product</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('home'); }} className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Background Remover</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('pricing'); }} className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('api'); }} className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">API</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Batch Processing</a>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.05em] mb-5 text-text-muted">Company</h4>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">About</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Blog</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Careers</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Contact</a>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.05em] mb-5 text-text-muted">Resources</h4>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Documentation</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Help Center</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Status</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Changelog</a>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.05em] mb-5 text-text-muted">Legal</h4>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Privacy</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Terms</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Security</a>
            <a href="#" className="block py-2 text-text-muted no-underline text-sm transition-colors duration-300 hover:text-text">Cookies</a>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-border">
          <div className="text-sm text-text-muted">&copy; 2024 ClearCut Inc. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 bg-surface-light rounded-[10px] flex items-center justify-center text-text-muted no-underline transition-all duration-300 hover:bg-accent hover:text-white hover:-translate-y-0.5"><TwitterSvg /></a>
            <a href="#" className="w-10 h-10 bg-surface-light rounded-[10px] flex items-center justify-center text-text-muted no-underline transition-all duration-300 hover:bg-accent hover:text-white hover:-translate-y-0.5"><GithubSvg /></a>
            <a href="#" className="w-10 h-10 bg-surface-light rounded-[10px] flex items-center justify-center text-text-muted no-underline transition-all duration-300 hover:bg-accent hover:text-white hover:-translate-y-0.5"><LinkedInSvg /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
