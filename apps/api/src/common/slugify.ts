import { slugify } from 'transliteration';

export const generateSlug = (name: string): string =>
  slugify(name.replace(/['’ʼ`]/g, ''), { lowercase: true, separator: '-' })
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
