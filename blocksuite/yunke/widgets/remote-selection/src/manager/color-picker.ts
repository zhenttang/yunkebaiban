class RandomPicker<T> {
  private _copyArray: T[];

  private readonly _originalArray: T[];

  constructor(array: T[]) {
    this._originalArray = [...array];
    this._copyArray = [...array];
  }

  private randomIndex(max: number): number {
    return Math.floor(Math.random() * max);
  }

  pick(): T {
    if (this._copyArray.length === 0) {
      this._copyArray = [...this._originalArray];
    }

    const index = this.randomIndex(this._copyArray.length);
    const item = this._copyArray[index];
    this._copyArray.splice(index, 1);
    return item;
  }
}

export const multiPlayersColor = new RandomPicker([
  'var(--yunke-multi-players-purple)',
  'var(--yunke-multi-players-magenta)',
  'var(--yunke-multi-players-red)',
  'var(--yunke-multi-players-orange)',
  'var(--yunke-multi-players-green)',
  'var(--yunke-multi-players-blue)',
  'var(--yunke-multi-players-brown)',
  'var(--yunke-multi-players-grey)',
]);
