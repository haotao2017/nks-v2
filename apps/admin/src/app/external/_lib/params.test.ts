import { describe, expect, it } from 'vitest';

import {
  isValidBaseParams,
  isValidDeviationParams,
  parsePartyParams,
} from './params';

describe('parsePartyParams', () => {
  it('reads PascalCase params case-insensitively', () => {
    const sp = new URLSearchParams({
      workflowid: '1',
      PROJECTID: '99',
      partyid: '3',
      PartyTypeID: '7',
      urlkey: 'abc',
      ckii: '1,2',
    });
    expect(parsePartyParams(sp)).toEqual({
      workflowId: '1',
      projectId: '99',
      partyId: '3',
      partyTypeId: '7',
      urlKey: 'abc',
      ckii: '1,2',
    });
  });

  it('resolves legacy UploadDocs aliases prId / ID', () => {
    const sp = new URLSearchParams({
      prId: '99',
      ID: '3',
      PartyTypeId: '7',
      UrlKey: 'abc',
    });
    expect(parsePartyParams(sp)).toEqual({
      workflowId: '1',
      projectId: '99',
      partyId: '3',
      partyTypeId: '7',
      urlKey: 'abc',
      ckii: '',
    });
  });

  it('defaults UrlKey for legacy UploadDocs redirect without UrlKey', () => {
    const sp = new URLSearchParams({
      prId: '99',
      ID: '3',
      PartyTypeId: '7',
    });
    expect(parsePartyParams(sp)).toEqual({
      workflowId: '1',
      projectId: '99',
      partyId: '3',
      partyTypeId: '7',
      urlKey: 'hZ8ygadsDaOLDSYS',
      ckii: '',
    });
  });
});

describe('param validation', () => {
  it('requires urlKey + party + partyType + project', () => {
    expect(
      isValidBaseParams({
        workflowId: '1',
        projectId: '9',
        partyId: '2',
        partyTypeId: '3',
        urlKey: 'k',
        ckii: '',
      }),
    ).toBe(true);
    expect(
      isValidBaseParams({
        workflowId: '1',
        projectId: '',
        partyId: '2',
        partyTypeId: '3',
        urlKey: 'k',
        ckii: '',
      }),
    ).toBe(false);
  });

  it('requires ckii for deviation updates', () => {
    const base = {
      workflowId: '1',
      projectId: '9',
      partyId: '2',
      partyTypeId: '3',
      urlKey: 'k',
      ckii: '',
    };
    expect(isValidDeviationParams(base)).toBe(false);
    expect(isValidDeviationParams({ ...base, ckii: '12' })).toBe(true);
  });
});
