import { slugify } from 'transliteration';

export const generateUsername = (name: string): string => {
  const base = slugify(name, { lowercase: true, separator: '_' })
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);

  return base.length >= 3 ? base : `user_${crypto.randomUUID().slice(0, 6)}`;
};
