export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: 'COP' = 'COP',
  ) {
    if (amount < 0) throw new Error('Money amount cannot be negative');
  }

  static of(amount: number): Money {
    return new Money(Math.round(amount));
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return Money.of(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return Money.of(Math.max(0, this.amount - other.amount));
  }

  multiplyByPercent(percent: number): Money {
    return Money.of(this.amount * (percent / 100));
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}
