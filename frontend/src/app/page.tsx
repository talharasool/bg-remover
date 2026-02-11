'use client';

import { useState, useCallback, useEffect } from 'react';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import BackgroundEffects from '@/components/layout/BackgroundEffects';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import DropZone from '@/components/home/DropZone';
import FeatureCards from '@/components/home/FeatureCards';
import ProcessingView from '@/components/home/ProcessingView';
import ResultView from '@/components/home/ResultView';
import ErrorView from '@/components/home/ErrorView';
import PricingHero from '@/components/pricing/PricingHero';
import PricingGrid from '@/components/pricing/PricingGrid';
import ComparisonTable from '@/components/pricing/ComparisonTable';
import FaqSection from '@/components/pricing/FaqSection';
import ApiHero from '@/components/api/ApiHero';
import CodeBlock from '@/components/api/CodeBlock';
import ApiFeatures from '@/components/api/ApiFeatures';
import ApiPricing from '@/components/api/ApiPricing';
import DocsCta from '@/components/api/DocsCta';
import ApiKeySignup from '@/components/api/ApiKeySignup';
import ApiDashboard from '@/components/api/ApiDashboard';
import AppIconPage from '@/components/appicons/AppIconPage';

type PageName = 'home' | 'pricing' | 'api' | 'appicons';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageName>('home');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Persist API key to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('clearcut_api_key');
    if (saved) setApiKey(saved);
  }, []);

  const handleApiKeyChange = useCallback((key: string | null) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('clearcut_api_key', key);
    } else {
      localStorage.removeItem('clearcut_api_key');
    }
  }, []);

  const navigate = useCallback((page: PageName) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const {
    homeState, progress, processingStatus, originalUrl, resultUrl,
    errorMsg, currentFileName, fileInputRef, handleFile, downloadResult, resetHome,
  } = useBackgroundRemoval();

  return (
    <>
      <BackgroundEffects />
      <Navbar currentPage={currentPage} navigate={navigate} />

      {/* HOME PAGE */}
      <div className={`relative z-10 min-h-screen pt-20 animate-page-in ${currentPage === 'home' ? 'block' : 'hidden'}`}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <HeroSection />
          <div className="max-w-[720px] mx-auto">
            <div className="animate-state-in">
              {homeState === 'idle' && (
                <>
                  <DropZone onFile={handleFile} fileInputRef={fileInputRef} />
                  <FeatureCards />
                </>
              )}
              {homeState === 'processing' && (
                <ProcessingView progress={progress} status={processingStatus} />
              )}
              {homeState === 'success' && (
                <ResultView
                  originalUrl={originalUrl}
                  resultUrl={resultUrl}
                  currentFileName={currentFileName}
                  onReset={resetHome}
                  onDownload={downloadResult}
                />
              )}
              {homeState === 'error' && (
                <ErrorView message={errorMsg} onRetry={resetHome} />
              )}
            </div>
          </div>
        </div>
        <Footer navigate={navigate} />
      </div>

      {/* PRICING PAGE */}
      <div className={`relative z-10 min-h-screen pt-20 animate-page-in ${currentPage === 'pricing' ? 'block' : 'hidden'}`}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <PricingHero billing={billing} setBilling={setBilling} />
          <PricingGrid billing={billing} />
          <ComparisonTable />
          <FaqSection />
        </div>
        <Footer navigate={navigate} />
      </div>

      {/* API PAGE */}
      <div className={`relative z-10 min-h-screen pt-20 animate-page-in ${currentPage === 'api' ? 'block' : 'hidden'}`}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <ApiHero
            onViewDocs={() => document.getElementById('docs-section')?.scrollIntoView({ behavior: 'smooth' })}
            onGetApiKey={() => document.getElementById('get-api-key')?.scrollIntoView({ behavior: 'smooth' })}
          />
          <CodeBlock />
          <ApiFeatures />

          {/* API Key Management Section */}
          <div id="get-api-key" className="py-25 border-t border-border">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                {apiKey ? 'Your API Dashboard' : 'Get Started'}
              </h2>
              <p className="text-text-muted text-lg max-w-md mx-auto">
                {apiKey
                  ? 'Monitor usage, manage your key, and track your quota.'
                  : 'Generate a free API key to start integrating ClearCut.'}
              </p>
            </div>
            {apiKey ? (
              <ApiDashboard
                apiKey={apiKey}
                onKeyRotated={(newKey) => handleApiKeyChange(newKey)}
                onKeyRevoked={() => handleApiKeyChange(null)}
              />
            ) : (
              <ApiKeySignup onKeyGenerated={(key) => handleApiKeyChange(key)} />
            )}
          </div>

          <ApiPricing />
          <DocsCta />
        </div>
        <Footer navigate={navigate} />
      </div>

      {/* APP ICONS PAGE */}
      <div className={`relative z-10 min-h-screen pt-20 animate-page-in ${currentPage === 'appicons' ? 'block' : 'hidden'}`}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <AppIconPage />
        </div>
        <Footer navigate={navigate} />
      </div>
    </>
  );
}
