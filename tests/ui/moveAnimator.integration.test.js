import { describe, expect, it, vi } from 'vitest';
import { buildMoveList, createMoveDiffHandler } from '../../src/ui/anim/moveAnimator.js';

describe('moveAnimator diff handler', () => {
  it('buildMoveList flags aspiration moves', () => {
    const prev = [{ id: 'r1', position: 1 }];
    const next = [{ id: 'r1', position: 3 }];
    const effects = [{ riderId: 'r1', type: 'aspiration' }];

    const moves = buildMoveList(prev, next, { effects });

    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({
      riderId: 'r1',
      fromIndex: 1,
      toIndex: 3,
      reason: 'aspiration'
    });
  });

  it('queues moves when positions change', async () => {
    const animator = {
      queueMoves: vi.fn(),
      playQueue: vi.fn().mockResolvedValue({ done: true })
    };

    const handler = createMoveDiffHandler({
      animator,
      getFromRect: () => ({ left: 0, top: 0, width: 10, height: 10 }),
      getToRect: () => ({ left: 20, top: 0, width: 10, height: 10 }),
      getMode: () => 'sequential',
      getSpeed: () => 1
    });

    const batchId = handler.capture(
      [{ id: 'r1', position: 1 }],
      [{ id: 'r1', position: 2 }],
      [{ riderId: 'r1', type: 'aspiration' }]
    );

    expect(batchId).not.toBeNull();
    await handler.playPending(batchId);

    expect(animator.queueMoves).toHaveBeenCalledTimes(1);
    expect(animator.playQueue).toHaveBeenCalledTimes(1);
    const queued = animator.queueMoves.mock.calls[0][0];
    expect(queued[0]).toMatchObject({
      riderId: 'r1',
      fromIndex: 1,
      toIndex: 2,
      reason: 'aspiration'
    });
  });
});
