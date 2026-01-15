/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMoveAnimator } from '../../src/ui/anim/moveAnimator.js';

function mockRect({ left, top, width, height }) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height
  };
}

describe('moveAnimator', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('queues and plays a move', async () => {
    vi.useFakeTimers();
    const overlay = document.createElement('div');
    overlay.getBoundingClientRect = () => mockRect({ left: 0, top: 0, width: 300, height: 120 });
    document.body.appendChild(overlay);

    const token = document.createElement('span');
    token.className = 'rider-token team_a';
    token.dataset.riderId = 'r1';
    token.getBoundingClientRect = () => mockRect({ left: 12, top: 12, width: 20, height: 20 });
    document.body.appendChild(token);

    const onStart = vi.fn();
    const onEnd = vi.fn();

    const animator = createMoveAnimator({
      getOverlay: () => overlay,
      getRiderElement: () => token,
      onStart,
      onEnd,
      baseDuration: 100,
      baseGap: 0
    });

    animator.queueMoves([
      {
        riderId: 'r1',
        fromIndex: 1,
        toIndex: 2,
        fromRect: mockRect({ left: 12, top: 12, width: 20, height: 20 }),
        toRect: mockRect({ left: 112, top: 12, width: 20, height: 20 })
      }
    ]);

    const playPromise = animator.playQueue({ mode: 'sequential', speed: 1 });
    await vi.runAllTimersAsync();
    await playPromise;

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(overlay.querySelectorAll('.track-move-ghost').length).toBe(0);
    expect(token.classList.contains('rider-token--ghost-hidden')).toBe(false);
  });

  it('cancels active animations', async () => {
    vi.useFakeTimers();
    const overlay = document.createElement('div');
    overlay.getBoundingClientRect = () => mockRect({ left: 0, top: 0, width: 320, height: 120 });
    document.body.appendChild(overlay);

    const token = document.createElement('span');
    token.className = 'rider-token team_a';
    token.dataset.riderId = 'r1';
    token.getBoundingClientRect = () => mockRect({ left: 10, top: 10, width: 20, height: 20 });
    document.body.appendChild(token);

    const animator = createMoveAnimator({
      getOverlay: () => overlay,
      getRiderElement: () => token,
      baseDuration: 200,
      baseGap: 0
    });

    animator.queueMoves([
      {
        riderId: 'r1',
        fromIndex: 1,
        toIndex: 2,
        fromRect: mockRect({ left: 10, top: 10, width: 20, height: 20 }),
        toRect: mockRect({ left: 110, top: 10, width: 20, height: 20 })
      }
    ]);

    const playPromise = animator.playQueue({ mode: 'sequential', speed: 1 });
    animator.cancel();
    await vi.runAllTimersAsync();
    await playPromise;

    expect(overlay.querySelectorAll('.track-move-ghost').length).toBe(0);
    expect(token.classList.contains('rider-token--ghost-hidden')).toBe(false);
  });

  it('respects reduced motion preference', async () => {
    vi.useFakeTimers();
    const overlay = document.createElement('div');
    overlay.getBoundingClientRect = () => mockRect({ left: 0, top: 0, width: 320, height: 120 });
    document.body.appendChild(overlay);

    const token = document.createElement('span');
    token.className = 'rider-token team_a';
    token.dataset.riderId = 'r1';
    token.getBoundingClientRect = () => mockRect({ left: 10, top: 10, width: 20, height: 20 });
    document.body.appendChild(token);

    const animator = createMoveAnimator({
      getOverlay: () => overlay,
      getRiderElement: () => token,
      getReducedMotion: () => true,
      baseDuration: 120,
      baseGap: 0
    });

    animator.queueMoves([
      {
        riderId: 'r1',
        fromIndex: 1,
        toIndex: 2,
        fromRect: mockRect({ left: 10, top: 10, width: 20, height: 20 }),
        toRect: mockRect({ left: 110, top: 10, width: 20, height: 20 })
      }
    ]);

    const playPromise = animator.playQueue({ mode: 'sequential', speed: 1 });
    await vi.runAllTimersAsync();
    await playPromise;

    expect(overlay.querySelectorAll('.track-move-ghost').length).toBe(0);
    expect(token.classList.contains('rider-token--ghost-hidden')).toBe(false);
  });
});
