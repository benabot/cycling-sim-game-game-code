import { RiderPool } from '../config/draft.config.js';
import { RiderConfig } from '../config/game.config.js';
import { TeamConfigs } from '../core/teams.js';
import { getRiderPortraitUrl } from './portraits.js';

export function buildFinalStandingsViewModel({ rankings = [], riders = [] } = {}) {
  const riderLookup = new Map();
  (riders || []).forEach(rider => {
    if (rider?.id) riderLookup.set(rider.id, rider);
  });

  const poolLookup = new Map();
  RiderPool.forEach(rider => poolLookup.set(rider.id, rider));

  return (rankings || []).map((entry, index) => {
    const riderFromState = riderLookup.get(entry?.id) || {};
    const riderFromPool = poolLookup.get(entry?.id) || {};
    const teamId = entry?.team || riderFromState.team || riderFromPool.team || null;
    const teamConfig = TeamConfigs[teamId] || null;
    const roleKey = riderFromState.type || riderFromPool.role || entry?.type || null;
    const portraitKey = riderFromState.portraitKey || riderFromPool.portraitKey || null;

    return {
      id: entry?.id || riderFromState.id || null,
      rank: Number.isFinite(entry?.finalRank) ? entry.finalRank : index + 1,
      name: entry?.name || riderFromState.name || riderFromPool.name || 'Coureur',
      teamName: teamConfig?.name || teamId || 'Équipe',
      teamColor: teamConfig?.color || 'rgba(255,255,255,0.4)',
      roleLabel: roleKey ? (RiderConfig[roleKey]?.name || roleKey) : null,
      portraitUrl: portraitKey ? getRiderPortraitUrl(portraitKey) : null
    };
  });
}
