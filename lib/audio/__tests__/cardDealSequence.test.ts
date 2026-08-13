import { createCardDealSchedule } from '../cardDealSequence';

describe('card deal sound triggers', () => {
  it('schedules one quick trigger per visually dealt card', () => {
    expect(createCardDealSchedule(3, true)).toEqual([0, 90, 180]);
  });

  it('schedules no playback when disabled and safely handles invalid counts', () => {
    expect(createCardDealSchedule(3, false)).toEqual([]);
    expect(createCardDealSchedule(-1, true)).toEqual([]);
  });
});
