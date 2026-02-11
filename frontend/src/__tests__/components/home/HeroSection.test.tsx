import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HeroSection from '@/components/home/HeroSection';

describe('HeroSection', () => {
  it('renders the headline', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Remove backgrounds/)).toBeInTheDocument();
    expect(screen.getByText(/like magic/)).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Professional quality in seconds/)).toBeInTheDocument();
  });

  it('renders the AI enhancement badge', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Now with AI enhancement/)).toBeInTheDocument();
  });
});
