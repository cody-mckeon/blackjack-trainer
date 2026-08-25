import { resolveDiscardTrayVisualSource } from '../DiscardTrayPhoto';

describe('DiscardTrayPhoto source resolution', () => {
  it('uses a real photo for a registered discarded-card count', () => {
    expect(resolveDiscardTrayVisualSource(52)).toMatchObject({
      kind: 'photo',
      photo: { discardedCards: 52, decksPlayed: 1 },
    });
  });

  it('falls back safely when no exact photo is registered', () => {
    expect(resolveDiscardTrayVisualSource(0)).toEqual({ kind: 'synthetic' });
    expect(resolveDiscardTrayVisualSource(325)).toEqual({ kind: 'synthetic' });
    expect(resolveDiscardTrayVisualSource(364)).toEqual({ kind: 'synthetic' });
  });
});
