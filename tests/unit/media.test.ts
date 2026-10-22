import { describe, expect, it } from 'vitest';
import { resolveMediaUrl } from '../../src/lib/media';
import { asset } from '../../src/lib/utils';
import { createSeed } from '../../src/lib/seed';
import { isWorkspace } from '../../src/lib/validation';

describe('portable cloud media references', () => {
  it('resolves the built-in image using this build’s base path', () => {
    expect(resolveMediaUrl('asset:images/mountain-dawn.jpg')).toBe(asset('images/mountain-dawn.jpg'));
  });
  it('supports existing root-relative references after publishing to Pages', () => {
    expect(resolveMediaUrl('/images/mountain-dawn.jpg')).toBe(asset('images/mountain-dawn.jpg'));
    expect(resolveMediaUrl('/ProViewPresentation/images/mountain-dawn.jpg')).toBe(
      asset('images/mountain-dawn.jpg'),
    );
  });
  it('keeps real uploaded file URLs unchanged', () => {
    const url = 'https://kaidaz18.duckdns.org/api/v1/proview/files/example.png';
    expect(resolveMediaUrl(url)).toBe(url);
  });
  it('does not masquerade device-only blobs as a cloud file', () => {
    expect(resolveMediaUrl('local:an-old-demo-file')).toBeUndefined();
  });
  it('seeds a valid workspace without a development-server media URL', () => {
    const workspace = createSeed('My church', 'Alex');
    expect(workspace.media[0].url).toBe('asset:images/mountain-dawn.jpg');
    expect(isWorkspace(workspace)).toBe(true);
  });
});
