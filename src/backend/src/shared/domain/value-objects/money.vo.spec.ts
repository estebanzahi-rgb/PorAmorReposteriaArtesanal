import { describe, it, expect } from 'vitest';
import { Money } from './money.vo';

describe('Money', () => {
  describe('of()', () => {
    it('rounds fractional amounts', () => {
      expect(Money.of(10.6).amount).toBe(11);
      expect(Money.of(10.4).amount).toBe(10);
    });

    it('accepts zero', () => {
      expect(Money.of(0).amount).toBe(0);
    });

    it('throws on negative amount', () => {
      expect(() => Money.of(-1)).toThrow('cannot be negative');
    });
  });

  describe('zero()', () => {
    it('returns amount 0', () => {
      expect(Money.zero().amount).toBe(0);
    });
  });

  describe('add()', () => {
    it('sums two Money instances', () => {
      expect(Money.of(100).add(Money.of(200)).amount).toBe(300);
    });

    it('adding zero is identity', () => {
      expect(Money.of(500).add(Money.zero()).amount).toBe(500);
    });
  });

  describe('subtract()', () => {
    it('subtracts amounts', () => {
      expect(Money.of(300).subtract(Money.of(100)).amount).toBe(200);
    });

    it('clamps to zero, never negative', () => {
      expect(Money.of(50).subtract(Money.of(100)).amount).toBe(0);
    });
  });

  describe('multiplyByPercent()', () => {
    it('calculates 10% of 1000', () => {
      expect(Money.of(1000).multiplyByPercent(10).amount).toBe(100);
    });

    it('calculates 15% and rounds', () => {
      expect(Money.of(333).multiplyByPercent(10).amount).toBe(33);
    });
  });

  describe('equals()', () => {
    it('returns true for same amount', () => {
      expect(Money.of(100).equals(Money.of(100))).toBe(true);
    });

    it('returns false for different amounts', () => {
      expect(Money.of(100).equals(Money.of(200))).toBe(false);
    });
  });
});
