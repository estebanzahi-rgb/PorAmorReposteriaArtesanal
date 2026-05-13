export class Rating {
  constructor(public readonly value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }
  }
}
