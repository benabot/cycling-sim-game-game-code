const DEFAULT_DURATION = 320;
const DEFAULT_GAP = 120;
const DEFAULT_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

function normalizeSpeed(speed) {
  const numeric = Number(speed);
  if (!Number.isFinite(numeric)) return 1;
  return numeric;
}

function resolveDuration(baseDuration, speed, reducedMotion) {
  if (speed <= 0) return 0;
  const duration = Math.round(baseDuration / speed);
  if (reducedMotion) return Math.min(160, duration);
  return Math.max(0, duration);
}

function resolveGap(baseGap, speed) {
  if (speed <= 0) return 0;
  return Math.max(0, Math.round(baseGap / speed));
}

function sleep(ms) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRect(element) {
  if (!element || !element.getBoundingClientRect) return null;
  const rect = element.getBoundingClientRect();
  if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top)) return null;
  return rect;
}

function resolveCenteredRect(cellRect, tokenRect) {
  if (!cellRect || !tokenRect) return null;
  return {
    left: cellRect.left + (cellRect.width - tokenRect.width) / 2,
    top: cellRect.top + (cellRect.height - tokenRect.height) / 2,
    width: tokenRect.width,
    height: tokenRect.height
  };
}

function getAnimationMode(mode) {
  if (mode === 'batch') return 'batch';
  return 'sequential';
}

export function buildMoveList(prevRiders = [], nextRiders = [], options = {}) {
  const prevById = new Map(prevRiders.map(rider => [rider.id, rider]));
  const effects = Array.isArray(options.effects) ? options.effects : [];
  const effectByRider = new Map();
  effects.forEach(effect => {
    if (effect?.riderId) {
      effectByRider.set(effect.riderId, effect);
    }
  });

  const moves = [];
  nextRiders.forEach(rider => {
    const prev = prevById.get(rider.id);
    if (!prev) return;
    const fromIndex = prev.position;
    const toIndex = rider.position;
    if (!Number.isFinite(fromIndex) || !Number.isFinite(toIndex)) return;
    if (fromIndex === toIndex) return;

    const effect = effectByRider.get(rider.id);
    const reason = effect?.type === 'aspiration' ? 'aspiration' : 'move';

    moves.push({
      riderId: rider.id,
      teamId: rider.teamId || rider.team,
      fromIndex,
      toIndex,
      reason
    });
  });

  return moves;
}

export function createMoveDiffHandler({
  animator,
  getFromRect,
  getToRect,
  getMode,
  getSpeed,
  getGap
} = {}) {
  let pending = null;
  let sequenceId = 0;

  function capture(prevRiders, nextRiders, effects = []) {
    if (!animator) return null;
    const moves = buildMoveList(prevRiders, nextRiders, { effects });
    if (!moves.length) return null;
    const fromRects = new Map();
    if (typeof getFromRect === 'function') {
      moves.forEach(move => {
        const rect = getFromRect(move);
        if (rect) {
          fromRects.set(move.riderId, rect);
        }
      });
    }
    sequenceId += 1;
    pending = { id: sequenceId, moves, fromRects };
    return sequenceId;
  }

  async function playPending(batchId) {
    if (!pending || pending.id !== batchId) {
      return { skipped: true };
    }
    const { moves, fromRects } = pending;
    pending = null;
    const queuedMoves = moves.map(move => ({
      ...move,
      fromRect: fromRects.get(move.riderId) || move.fromRect,
      toRect: typeof getToRect === 'function' ? getToRect(move) : move.toRect
    }));
    animator.queueMoves(queuedMoves);
    return animator.playQueue({
      mode: typeof getMode === 'function' ? getMode(queuedMoves) : undefined,
      speed: typeof getSpeed === 'function' ? getSpeed() : undefined,
      gap: typeof getGap === 'function' ? getGap() : undefined
    });
  }

  return { capture, playPending };
}

export function createMoveAnimator({
  getOverlay,
  getRiderElement,
  getCellElement,
  onStart,
  onEnd,
  baseDuration = DEFAULT_DURATION,
  baseGap = DEFAULT_GAP,
  easing = DEFAULT_EASING,
  getReducedMotion
} = {}) {
  let queue = [];
  let playing = false;
  let cancelled = false;
  const hiddenTokens = new Set();
  const activeGhosts = new Set();
  const activeAnimations = new Set();

  function queueMoves(moves = []) {
    if (!Array.isArray(moves) || moves.length === 0) return;
    queue.push(...moves);
  }

  function cleanupGhost(ghost) {
    if (!ghost) return;
    ghost.remove();
    activeGhosts.delete(ghost);
  }

  function hideToken(token) {
    if (!token) return;
    token.classList.add('rider-token--ghost-hidden');
    hiddenTokens.add(token);
  }

  function showToken(token) {
    if (!token) return;
    token.classList.remove('rider-token--ghost-hidden');
    hiddenTokens.delete(token);
  }

  function clearHiddenTokens() {
    hiddenTokens.forEach(token => token.classList.remove('rider-token--ghost-hidden'));
    hiddenTokens.clear();
  }

  function cancelActiveAnimations() {
    activeAnimations.forEach(animation => {
      if (animation && typeof animation.cancel === 'function') {
        animation.cancel();
      }
    });
    activeAnimations.clear();
  }

  function cancel() {
    cancelled = true;
    queue = [];
    cancelActiveAnimations();
    activeGhosts.forEach(ghost => ghost.remove());
    activeGhosts.clear();
    clearHiddenTokens();
  }

  function createGhost(sourceEl, fromRect, reason) {
    const ghost = sourceEl.cloneNode(true);
    ghost.classList.add('track-move-ghost');
    ghost.classList.remove('selected', 'active', 'animating', 'rider-token--ghost-hidden', 'rider-token--fade');
    if (reason === 'aspiration') {
      ghost.classList.add('track-move-ghost--aspiration');
    }
    ghost.removeAttribute('data-rider-id');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = `${fromRect.width}px`;
    ghost.style.height = `${fromRect.height}px`;
    return ghost;
  }

  function animateGhost(ghost, from, to, duration) {
    const startTransform = `translate3d(${from.x}px, ${from.y}px, 0)`;
    const endTransform = `translate3d(${to.x}px, ${to.y}px, 0)`;
    ghost.style.transform = startTransform;

    if (typeof ghost.animate === 'function') {
      const animation = ghost.animate(
        [{ transform: startTransform }, { transform: endTransform }],
        { duration, easing, fill: 'forwards' }
      );
      return { animation, finished: animation.finished.catch(() => null) };
    }

    const raf = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (callback) => setTimeout(callback, 0);

    const finished = new Promise(resolve => {
      raf(() => {
        ghost.style.transition = `transform ${duration}ms ${easing}`;
        ghost.style.transform = endTransform;
        setTimeout(resolve, duration);
      });
    });

    return { animation: null, finished };
  }

  function resolveFromRect(move, tokenRect) {
    if (move.fromRect) return move.fromRect;
    if (typeof getCellElement !== 'function') return null;
    const cell = getCellElement(move.fromIndex);
    const cellRect = getRect(cell);
    return resolveCenteredRect(cellRect, tokenRect);
  }

  function resolveToRect(move, tokenRect) {
    if (move.toRect) return move.toRect;
    if (typeof getCellElement !== 'function') return tokenRect;
    const cell = getCellElement(move.toIndex);
    const cellRect = getRect(cell);
    return resolveCenteredRect(cellRect, tokenRect) || tokenRect;
  }

  async function playMove(move, { overlayEl, duration }) {
    if (cancelled) return;
    const tokenEl = typeof getRiderElement === 'function' ? getRiderElement(move.riderId) : null;
    if (!overlayEl || !tokenEl) return;

    const overlayRect = getRect(overlayEl);
    const tokenRect = getRect(tokenEl);
    if (!overlayRect || !tokenRect) return;

    const fromRect = resolveFromRect(move, tokenRect);
    const toRect = resolveToRect(move, tokenRect);
    if (!fromRect || !toRect) return;

    if (fromRect.left === toRect.left && fromRect.top === toRect.top) return;

    const from = {
      x: fromRect.left - overlayRect.left,
      y: fromRect.top - overlayRect.top
    };
    const to = {
      x: toRect.left - overlayRect.left,
      y: toRect.top - overlayRect.top
    };

    const ghost = createGhost(tokenEl, fromRect, move.reason);
    overlayEl.appendChild(ghost);
    activeGhosts.add(ghost);
    hideToken(tokenEl);

    try {
      const { animation, finished } = animateGhost(ghost, from, to, duration);
      if (animation) activeAnimations.add(animation);
      await finished;
      if (animation) activeAnimations.delete(animation);
    } finally {
      cleanupGhost(ghost);
      showToken(tokenEl);
    }
  }

  async function playReduced(moves, duration) {
    for (const move of moves) {
      if (cancelled) return;
      const tokenEl = typeof getRiderElement === 'function' ? getRiderElement(move.riderId) : null;
      if (!tokenEl) continue;
      if (duration > 0) {
        tokenEl.classList.add('rider-token--fade');
        await sleep(duration);
        tokenEl.classList.remove('rider-token--fade');
      }
    }
  }

  async function drainQueue({ mode, speed, gap } = {}) {
    const overlayEl = typeof getOverlay === 'function' ? getOverlay() : null;
    if (!overlayEl) {
      queue = [];
      return { skipped: true };
    }

    const normalizedSpeed = normalizeSpeed(speed ?? 1);
    const reducedMotion = !!getReducedMotion?.() || normalizedSpeed <= 0;
    const resolvedMode = getAnimationMode(mode);
    const duration = resolveDuration(baseDuration, normalizedSpeed, reducedMotion);
    const resolvedGap = resolveGap(gap ?? baseGap, normalizedSpeed);

    while (queue.length && !cancelled) {
      const batch = resolvedMode === 'batch' ? queue.splice(0) : [queue.shift()];

      if (reducedMotion) {
        await playReduced(batch, duration);
        continue;
      }

      if (resolvedMode === 'batch') {
        await Promise.all(batch.map(move => playMove(move, { overlayEl, duration })));
      } else {
        for (const move of batch) {
          if (cancelled) return;
          await playMove(move, { overlayEl, duration });
          await sleep(resolvedGap);
        }
      }
    }
    return { done: true };
  }

  async function playQueue(options = {}) {
    if (playing) return { queued: true };
    if (!queue.length) return { skipped: true };
    playing = true;
    cancelled = false;
    if (typeof onStart === 'function') {
      onStart();
    }
    try {
      return await drainQueue(options);
    } finally {
      playing = false;
      if (typeof onEnd === 'function') {
        onEnd();
      }
    }
  }

  return {
    queueMoves,
    playQueue,
    cancel
  };
}
