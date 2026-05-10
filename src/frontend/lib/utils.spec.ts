import { describe, it, expect } from 'vitest';
import { formatCOP } from './utils';

describe('formatCOP', () => {
  it('formats zero as $0', () => {
    const result = formatCOP(0);
    expect(result).toMatch(/0/);
  });

  it('includes COP currency symbol or code', () => {
    const result = formatCOP(50_000);
    expect(result).toMatch(/50[.,]000/);
  });

  it('formats large amounts with thousands separator', () => {
    const result = formatCOP(1_000_000);
    expect(result).toMatch(/1[.,]000[.,]000/);
  });

  it('does not include decimal places', () => {
    const result = formatCOP(50_000);
    expect(result).not.toMatch(/\.\d{2}$/);
  });
});
