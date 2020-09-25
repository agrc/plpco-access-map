import { getIDFromUrl } from './Video';

describe('getIDFromUrl', function () {
  it('handles both types of URLs', function () {
      expect(getIDFromUrl('https://youtu.be/4VLg3nhoOBY')).toEqual('4VLg3nhoOBY');
      expect(getIDFromUrl('https://www.youtube.com/watch?v=FpZG97zHsX4')).toEqual('FpZG97zHsX4');
  });
});
