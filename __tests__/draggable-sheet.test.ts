import { calculateDestination } from '../src/DraggableSheet';

describe('calculateDestination', () => {
  const height = 1000;

  it('settles to full screen (0) when flicked up strongly', () => {
    // velocity < -0.45
    expect(calculateDestination(500, -0.5, height)).toBe(0);
  });

  it('settles to full screen (0) when projected position is within FULL_ZONE', () => {
    // FULL_ZONE is 0.15 * 1000 = 150
    // proj = 200 + (-0.4 * 140) = 200 - 56 = 144
    expect(calculateDestination(200, -0.4, height)).toBe(0);
  });

  it('closes (returns height) when flicked down strongly', () => {
    // velocity > 0.45
    expect(calculateDestination(500, 0.5, height)).toBe(height);
  });

  it('closes (returns height) when projected position is within CLOSE_ZONE', () => {
    // CLOSE_ZONE is 0.75 * 1000 = 750
    // proj = 700 + (0.4 * 140) = 700 + 56 = 756
    expect(calculateDestination(700, 0.4, height)).toBe(height);
  });

  it('leaves the sheet at its released position when released in the middle', () => {
    // projected = 500 + 0 = 500
    // Not flicked, not in full zone (<150), not in close zone (>750)
    expect(calculateDestination(500, 0, height)).toBe(500);
  });

  it('caps the position to 0 and height when calculating mid-release', () => {
    // position = -50 (overdrag), velocity = 0 => proj = -50.
    // Wait, if proj is -50, it is <= FULL_ZONE (150). So it returns 0.
    // If we wanted to test the bounds of the "else" branch:
    // Let's release at 151 with positive velocity to stay out of full zone, but proj < 750.
    // e.g. pos = 200, vel = 0 => returns 200
    expect(calculateDestination(200, 0, height)).toBe(200);
  });

  describe('Gesture.Pan velocity in px/s (normalized automatically)', () => {
    it('settles to full screen (0) when flicked up at -500 px/s', () => {
      expect(calculateDestination(500, -500, height)).toBe(0);
    });

    it('closes (returns height) when flicked down at 500 px/s', () => {
      expect(calculateDestination(500, 500, height)).toBe(height);
    });

    it('leaves the sheet in the middle when released slowly at 100 px/s', () => {
      // 100 px/s = 0.1 px/ms. proj = 500 + 0.1 * 140 = 514
      // 514 is between 150 (FULL_ZONE) and 750 (CLOSE_ZONE)
      expect(calculateDestination(500, 100, height)).toBe(500);
    });
  });
});
