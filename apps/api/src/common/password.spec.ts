import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('verifies the password it hashed', async () => {
    const stored = await hashPassword('correct horse battery staple');

    await expect(
      verifyPassword(stored, 'correct horse battery staple'),
    ).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hashPassword('correct horse battery staple');

    await expect(
      verifyPassword(stored, 'Correct horse battery staple'),
    ).resolves.toBe(false);
  });

  it('uses a fresh nonce for every hash', async () => {
    const first = await hashPassword('same password');
    const second = await hashPassword('same password');

    expect(first).not.toEqual(second);
    await expect(verifyPassword(first, 'same password')).resolves.toBe(true);
    await expect(verifyPassword(second, 'same password')).resolves.toBe(true);
  });

  it('stores algorithm, version and cost parameters', async () => {
    const [empty, algorithm, version, params] = (
      await hashPassword('whatever')
    ).split('$');

    expect(empty).toBe('');
    expect(algorithm).toBe('argon2id');
    expect(version).toBe('v=19');
    expect(params).toMatch(/^m=\d+,t=\d+,p=\d+$/);
  });
});
