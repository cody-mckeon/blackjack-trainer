import { classifyBasicStrategyResponseSpeed } from '../responseSpeed';

describe('response speed', () => {
  it('uses tunable product thresholds at their boundaries', () => {
    expect(classifyBasicStrategyResponseSpeed(1499)).toBe('automatic');
    expect(classifyBasicStrategyResponseSpeed(1500)).toBe('fast');
    expect(classifyBasicStrategyResponseSpeed(2999)).toBe('fast');
    expect(classifyBasicStrategyResponseSpeed(3000)).toBe('calculating');
    expect(classifyBasicStrategyResponseSpeed(5000)).toBe('needs-practice');
  });
});
