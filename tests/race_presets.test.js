import { describe, it, expect } from 'vitest';
import {
  ClassicPresets,
  ClassicId,
  StageType,
  getStageTypePreset
} from '../src/config/race-presets.js';
import { TerrainType, generateCourseFromPreset } from '../src/core/terrain.js';

const COURSE_LENGTH = 80;

function getSegments(course) {
  const segments = [];
  for (const cell of course) {
    if (!segments.length || segments[segments.length - 1].terrain !== cell.terrain) {
      segments.push({ terrain: cell.terrain, length: 1 });
    } else {
      segments[segments.length - 1].length += 1;
    }
  }
  return segments;
}

function getRefuelSegments(course) {
  const segments = [];
  for (const cell of course) {
    const isRefuel = !!cell.isRefuelZone;
    if (!segments.length || segments[segments.length - 1].isRefuel !== isRefuel) {
      segments.push({ isRefuel, length: 1 });
    } else {
      segments[segments.length - 1].length += 1;
    }
  }
  return segments.filter(segment => segment.isRefuel);
}

function getCobbleSegments(course) {
  const segments = [];
  for (const cell of course) {
    const isCobbles = !!cell.isCobbles;
    if (!segments.length || segments[segments.length - 1].isCobbles !== isCobbles) {
      segments.push({ isCobbles, length: 1 });
    } else {
      segments[segments.length - 1].length += 1;
    }
  }
  return segments.filter(segment => segment.isCobbles);
}

function makeClassicPreset(classicId) {
  return { ...ClassicPresets[classicId], presetType: classicId };
}

function makeStagePreset(stageType) {
  const preset = getStageTypePreset(stageType);
  return { ...preset, presetType: stageType };
}

describe('Race presets V1 constraints', () => {
  it('flandrien has no mountain and hills >= 6', () => {
    const course = generateCourseFromPreset(
      makeClassicPreset(ClassicId.ARDENNAISE),
      COURSE_LENGTH,
      { rng: () => 0.3 }
    );
    const segments = getSegments(course);

    expect(segments.filter(segment => segment.terrain === TerrainType.MOUNTAIN)).toHaveLength(0);
    segments
      .filter(segment => segment.terrain === TerrainType.HILL)
      .forEach(segment => expect(segment.length).toBeGreaterThanOrEqual(6));

    getRefuelSegments(course).forEach(segment => {
      expect(segment.length).toBeGreaterThanOrEqual(5);
      expect(segment.length).toBeLessThanOrEqual(6);
    });
  });

  it('paves alternates hills/flats and ends with sprint', () => {
    const course = generateCourseFromPreset(
      makeClassicPreset(ClassicId.NORD),
      COURSE_LENGTH,
      { rng: () => 0.25 }
    );
    const segments = getSegments(course);
    const cobbleSegments = getCobbleSegments(course);
    const hillFlatSequence = segments
      .filter(segment => segment.terrain === TerrainType.HILL || segment.terrain === TerrainType.FLAT)
      .map(segment => segment.terrain);

    expect(course[course.length - 1].terrain).toBe(TerrainType.SPRINT);
    expect(segments.filter(segment => segment.terrain === TerrainType.MOUNTAIN)).toHaveLength(0);
    expect(cobbleSegments.length).toBeGreaterThanOrEqual(4);
    expect(cobbleSegments.length).toBeLessThanOrEqual(6);
    cobbleSegments.forEach(segment => {
      expect(segment.length).toBeGreaterThanOrEqual(4);
      expect(segment.length).toBeLessThanOrEqual(6);
    });
    course
      .filter(cell => cell.isCobbles)
      .forEach(cell => {
        expect(cell.terrain).not.toBe(TerrainType.MOUNTAIN);
        expect(cell.terrain).not.toBe(TerrainType.SPRINT);
        expect(cell.isRefuelZone).toBe(false);
      });
    expect(hillFlatSequence).toContain(TerrainType.HILL);
    expect(hillFlatSequence).toContain(TerrainType.FLAT);

    for (let i = 1; i < hillFlatSequence.length; i++) {
      expect(hillFlatSequence[i]).not.toBe(hillFlatSequence[i - 1]);
    }

    segments
      .filter(segment => segment.terrain === TerrainType.HILL)
      .forEach(segment => expect(segment.length).toBeGreaterThanOrEqual(6));

    getRefuelSegments(course).forEach(segment => {
      expect(segment.length).toBeGreaterThanOrEqual(5);
      expect(segment.length).toBeLessThanOrEqual(6);
    });
  });

  it('mountain stages include multiple long climbs with flats and descents', () => {
    const course = generateCourseFromPreset(
      makeStagePreset(StageType.MOUNTAIN),
      COURSE_LENGTH,
      { rng: () => 0.99 }
    );
    const segments = getSegments(course);
    const mountainSegments = segments.filter(segment => segment.terrain === TerrainType.MOUNTAIN);

    expect(course[course.length - 1].terrain).not.toBe(TerrainType.SPRINT);
    expect(mountainSegments.length).toBeGreaterThanOrEqual(2);
    mountainSegments.forEach(segment => expect(segment.length).toBeGreaterThanOrEqual(15));
    expect(segments.some(segment => segment.terrain === TerrainType.DESCENT)).toBe(true);
    expect(segments.some(segment => segment.terrain === TerrainType.FLAT)).toBe(true);
  });

  it('mountain sprint finish happens only when the chance triggers', () => {
    const course = generateCourseFromPreset(
      makeStagePreset(StageType.MOUNTAIN),
      COURSE_LENGTH,
      { rng: () => 0.0 }
    );

    expect(course[course.length - 1].terrain).toBe(TerrainType.SPRINT);
  });

  it('never generates mountain segments shorter than 15', () => {
    const presets = [
      makeClassicPreset(ClassicId.ARDENNAISE),
      makeClassicPreset(ClassicId.LOMBARDE),
      makeClassicPreset(ClassicId.RIVIERA),
      makeClassicPreset(ClassicId.NORD),
      makeStagePreset(StageType.FLAT),
      makeStagePreset(StageType.HILLY),
      makeStagePreset(StageType.MOUNTAIN),
      makeStagePreset(StageType.SPRINT)
    ];

    presets.forEach(preset => {
      const course = generateCourseFromPreset(preset, COURSE_LENGTH, { rng: () => 0.42 });
      const segments = getSegments(course);
      const shortMountains = segments.filter(
        segment => segment.terrain === TerrainType.MOUNTAIN && segment.length < 15
      );
      expect(shortMountains).toHaveLength(0);
    });
  });
});
