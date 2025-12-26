/**
 * Aspiration and peloton mechanics
 * @module core/aspiration
 */

import { hasAspiration } from './terrain.js';

/**
 * Aspiration rules
 */
export const AspirationRules = {
  regroupGap: 1,    // Regroup if 1 case gap
  breakawayGap: 2   // Breakaway if 2+ cases gap
};

/**
 * Check if a rider is taking the wind (no one in front or too far ahead)
 * @param {Object} rider - Current rider
 * @param {Array} allRiders - All riders in race
 * @param {string} terrain - Current terrain type
 * @returns {boolean}
 */
export function isTakingWind(rider, allRiders, terrain) {
  // No wind penalty in mountain or descent
  if (!hasAspiration(terrain)) {
    return false;
  }
  
  // Find riders ahead
  const ridersAhead = allRiders.filter(r => 
    r.id !== rider.id && 
    r.position > rider.position &&
    !r.hasFinished
  );
  
  // If no one ahead, taking the wind
  if (ridersAhead.length === 0) {
    return true;
  }
  
  // Find closest rider ahead
  const closestAhead = ridersAhead.reduce((closest, r) => 
    r.position < closest.position ? r : closest
  );
  
  // Gap of 2+ means taking wind (breakaway)
  const gap = closestAhead.position - rider.position;
  return gap >= AspirationRules.breakawayGap;
}

/**
 * Check if rider is in the peloton (not in breakaway)
 * @param {Object} rider - Current rider
 * @param {Array} allRiders - All riders in race
 * @returns {boolean}
 */
export function isInPeloton(rider, allRiders) {
  const activeRiders = allRiders.filter(r => !r.hasFinished);
  
  if (activeRiders.length <= 1) {
    return false; // Can't be in peloton alone
  }
  
  // Check if there's someone within 1 case
  const hasNeighbor = activeRiders.some(r => 
    r.id !== rider.id && 
    Math.abs(r.position - rider.position) <= 1
  );
  
  return hasNeighbor;
}

/**
 * Apply aspiration regrouping at end of turn
 * @param {Array} riders - All riders
 * @param {string} terrain - Current terrain
 * @returns {Array} Updated riders with regrouping applied
 */
export function applyAspiration(riders, terrain) {
  // No aspiration in mountain or descent
  if (!hasAspiration(terrain)) {
    return riders;
  }
  
  // Sort riders by position (front to back)
  const sorted = [...riders].sort((a, b) => b.position - a.position);
  const updated = [...sorted];
  
  // Apply regrouping: if 1 case gap, move rear rider forward
  for (let i = 0; i < updated.length - 1; i++) {
    const frontRider = updated[i];
    const rearRider = updated[i + 1];
    
    if (frontRider.hasFinished || rearRider.hasFinished) continue;
    
    const gap = frontRider.position - rearRider.position;
    
    // If exactly 1 case gap, regroup
    if (gap === AspirationRules.regroupGap + 1) {
      updated[i + 1] = {
        ...rearRider,
        position: rearRider.position + 1
      };
    }
  }
  
  // Return in original order
  return riders.map(r => updated.find(u => u.id === r.id));
}

/**
 * Get groups of riders (for display and mechanics)
 * @param {Array} riders - All riders
 * @returns {Array<Array>} Groups of riders
 */
export function getRiderGroups(riders) {
  const activeRiders = riders.filter(r => !r.hasFinished);
  
  if (activeRiders.length === 0) return [];
  
  // Sort by position
  const sorted = [...activeRiders].sort((a, b) => b.position - a.position);
  
  const groups = [];
  let currentGroup = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const prevRider = sorted[i - 1];
    const currRider = sorted[i];
    const gap = prevRider.position - currRider.position;
    
    if (gap <= 1) {
      // Same group
      currentGroup.push(currRider);
    } else {
      // New group
      groups.push(currentGroup);
      currentGroup = [currRider];
    }
  }
  
  groups.push(currentGroup);
  return groups;
}

/**
 * Calculate gap to leader
 * @param {Object} rider - Current rider
 * @param {Array} allRiders - All riders
 * @returns {number} Gap in cases
 */
export function getGapToLeader(rider, allRiders) {
  const activeRiders = allRiders.filter(r => !r.hasFinished);
  
  if (activeRiders.length === 0) return 0;
  
  const leader = activeRiders.reduce((l, r) => 
    r.position > l.position ? r : l
  );
  
  return leader.position - rider.position;
}
