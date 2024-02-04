import RoyalRoad from '../src/sites/royalroad.js';

describe('RoyalRoad', () => {
  it('Parses multiple chapter story', () => {
    const url =
      'https://www.royalroad.com/fiction/55418/rock-falls-everyone-dies';
    const site = new RoyalRoad(url);
    expect(site.isValidSite()).toBe(true);
  });
});
