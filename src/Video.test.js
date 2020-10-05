import { getIDFromUrl } from './Video';

describe('getIDFromUrl', () => {
  it('handles both types of URLs', () => {
    expect(getIDFromUrl('https://youtu.be/4VLg3nhoOBY')).toEqual('4VLg3nhoOBY');
    expect(getIDFromUrl('https://www.youtube.com/watch?v=FpZG97zHsX4')).toEqual('FpZG97zHsX4');
  });
  it('raises an error for bad URLs', () => {
    expect(() => getIDFromUrl('<Null>')).toThrow();
  });
});
