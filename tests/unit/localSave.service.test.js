/* @vitest-environment jsdom */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCSG } from '../../src/services/localSave.service.js';

describe('downloadCSG', () => {
  let originalCreateElement;
  let createdAnchor;

  beforeEach(() => {
    createdAnchor = null;
    originalCreateElement = document.createElement.bind(document);

    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        value: () => '',
        writable: true
      });
    }
    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: () => {},
        writable: true
      });
    }

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        createdAnchor = element;
      }
      return element;
    });

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local-save');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('downloads a .csg file with a date stamp', () => {
    const payload = { meta: { name: 'Ma Partie' }, state: { foo: 'bar' } };

    downloadCSG({ filename: 'Ma Partie', payload });

    expect(createdAnchor).toBeTruthy();
    expect(createdAnchor.download).toMatch(/ma-partie-\d{4}-\d{2}-\d{2}\.csg$/);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

    const blobArg = URL.createObjectURL.mock.calls[0][0];
    expect(blobArg instanceof Blob).toBe(true);
    expect(blobArg.type).toBe('application/octet-stream');

    vi.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-save');
  });
});
