import type {RightsInfo} from '../../app/domain/catalogue';
import {RightsPolicy} from '../../app/domain/rights';

const rendition: {rights: RightsInfo} = {
  rights: {
    status: 'public-domain',
    source: 'librivox',
    verifiedAt: '2026-10-05T00:00:00Z',
    territories: ['TZ'],
  },
};

describe('rights and trusted source policy', () => {
  it('fails closed for unknown rights, untrusted remotes and excluded territories', () => {
    const policy = new RightsPolicy('TZ', ['internetarchive']);

    expect(policy.evaluate(
      {status: 'unknown', source: 'test', verifiedAt: '2026-10-05T00:00:00Z'},
      {kind: 'https', trustedSourceId: 'internetarchive'},
    ).allowed).toBe(false);

    expect(policy.evaluate(
      rendition.rights,
      {kind: 'torrent', trustedSourceId: 'random-index'},
    ).allowed).toBe(false);

    expect(new RightsPolicy('KE', ['internetarchive']).evaluate(
      rendition.rights,
      {kind: 'https', trustedSourceId: 'internetarchive'},
    ).allowed).toBe(false);
  });
});
