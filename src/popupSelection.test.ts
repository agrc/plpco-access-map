import { describe, expect, it } from 'vitest';
import { isPopupEnabledGraphic } from './popupSelection';

describe('isPopupEnabledGraphic', () => {
  it('returns true for a layer with popups enabled', () => {
    expect(isPopupEnabledGraphic({ layer: { popupEnabled: true } })).toBe(true);
  });

  it('returns false for a layer with popups disabled', () => {
    expect(isPopupEnabledGraphic({ layer: { popupEnabled: false } })).toBe(false);
  });

  it('returns false when the graphic has no layer', () => {
    expect(isPopupEnabledGraphic({})).toBe(false);
    expect(isPopupEnabledGraphic(null)).toBe(false);
  });

  it('does not require a popup template', () => {
    expect(isPopupEnabledGraphic({ layer: { popupEnabled: true } })).toBe(true);
  });
});
