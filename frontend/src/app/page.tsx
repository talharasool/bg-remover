'use client';

import { useState, useCallback } from 'react';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import BackgroundEffects from '@/components/layout/BackgroundEffects';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FooterMinimal from '@/components/layout/FooterMinimal';
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

type PageName = 'home' | 'pricing' | 'api';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageName>('home');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const navigate = useCallback((page: PageName) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const {
    homeState, progress, processingStatus, originalUrl, resultUrl,
    errorMsg, fileInputRef, handleFile, downloadResult, resetHome,
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
        <FooterMinimal showSocial />
      </div>

      {/* API PAGE */}
      <div className={`relative z-10 min-h-screen pt-20 animate-page-in ${currentPage === 'api' ? 'block' : 'hidden'}`}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <ApiHero onViewDocs={() => document.getElementById('docs-section')?.scrollIntoView({ behavior: 'smooth' })} />
          <CodeBlock />
          <ApiFeatures />
          <ApiPricing />
          <DocsCta />
        </div>
        <FooterMinimal />
      </div>
    </>
  );
}
