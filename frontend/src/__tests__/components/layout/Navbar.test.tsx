import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '@/components/layout/Navbar';

describe('Navbar', () => {
  const navigate = vi.fn();

  afterEach(() => {
    navigate.mockClear();
  });

  it('renders the logo text', () => {
    render(<Navbar currentPage="home" navigate={navigate} />);
    expect(screen.getByText('ClearCut')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Navbar currentPage="home" navigate={navigate} />);
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
  });

  it('renders Get Started button', () => {
    render(<Navbar currentPage="home" navigate={navigate} />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('navigates to home when logo is clicked', () => {
    render(<Navbar currentPage="pricing" navigate={navigate} />);
    fireEvent.click(screen.getByText('ClearCut'));
    expect(navigate).toHaveBeenCalledWith('home');
  });

  it('navigates to pricing when Pricing link is clicked', () => {
    render(<Navbar currentPage="home" navigate={navigate} />);
    fireEvent.click(screen.getByText('Pricing'));
    expect(navigate).toHaveBeenCalledWith('pricing');
  });

  it('navigates to api when API link is clicked', () => {
    render(<Navbar currentPage="home" navigate={navigate} />);
    fireEvent.click(screen.getByText('API'));
    expect(navigate).toHaveBeenCalledWith('api');
  });

  it('highlights the active page link', () => {
    const { rerender } = render(<Navbar currentPage="home" navigate={navigate} />);
    const productLink = screen.getByText('Product');
    expect(productLink.className).toContain('text-text');

    rerender(<Navbar currentPage="pricing" navigate={navigate} />);
    const pricingLink = screen.getByText('Pricing');
    expect(pricingLink.className).toContain('text-text');
  });
});
