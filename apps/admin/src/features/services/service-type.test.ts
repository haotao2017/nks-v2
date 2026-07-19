import { describe, expect, it } from 'vitest';

import {
  encodeServiceTypeFormValue,
  hydrateServiceTypeFormValue,
  SERVICE_TYPE_NONE_FORM,
  SERVICE_TYPE_NONE_ID,
} from './service-type';

describe('serviceType encode/hydrate', () => {
  it('encodes Ingen as 3', () => {
    expect(encodeServiceTypeFormValue(SERVICE_TYPE_NONE_FORM)).toBe(SERVICE_TYPE_NONE_ID);
    expect(encodeServiceTypeFormValue('1')).toBe(1);
    expect(encodeServiceTypeFormValue('2')).toBe(2);
  });

  it('hydrates create default to 1', () => {
    expect(hydrateServiceTypeFormValue(undefined, false)).toBe('1');
    expect(hydrateServiceTypeFormValue(3, false)).toBe('1');
  });

  it('hydrates edit: 3 and missing → none', () => {
    expect(hydrateServiceTypeFormValue(3, true)).toBe(SERVICE_TYPE_NONE_FORM);
    expect(hydrateServiceTypeFormValue(undefined, true)).toBe(SERVICE_TYPE_NONE_FORM);
    expect(hydrateServiceTypeFormValue(null, true)).toBe(SERVICE_TYPE_NONE_FORM);
    expect(hydrateServiceTypeFormValue(1, true)).toBe('1');
    expect(hydrateServiceTypeFormValue(2, true)).toBe('2');
  });
});
