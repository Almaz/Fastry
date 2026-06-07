/**
 * Canonical-id resolution for durable internal links.
 *
 * Phase 1: lets posts link to one another by a stable `uid` instead of a slug,
 * so renaming a file (and therefore its slug) never silently breaks inbound
 * links. The <PostLink> component calls `resolvePostUrl`, which throws at build
 * time when a uid is unknown — turning a broken internal link into a failed
 * build instead of a silent 404.
 *
 * The pure helpers (`buildUidIndex`, `normalizeUid`) take plain data so they
 * can be unit-tested without the Astro content runtime. The astro-facing
 * `resolvePostUrl` / `assertValidPostUids` load the blog collection (cached)
 * and build locale-aware URLs.
 */
import { localizedPath, defaultLocale } from '@/i18n';
import { localeStrippedSlug } from './content-validation';

/** A post resolved from its canonical id, within one locale. */
export interface ResolvedPost {
  slug: string;
  title: string;
}

/** Minimal shape of a blog entry needed to resolve canonical ids. */
interface UidEntryLike {
  id: string;
  data: { locale: string; uid?: string; title: string };
}

/**
 * Build an index of `uid -> (locale -> post)`. Posts without a uid are skipped.
 * Throws if two posts in the same locale claim the same uid, since a canonical
 * id must point to a single post per locale (the same uid across *different*
 * locales is expected — those are translations of one logical post).
 */
export function buildUidIndex(
  posts: UidEntryLike[]
): Map<string, Map<string, ResolvedPost>> {
  const index = new Map<string, Map<string, ResolvedPost>>();
  for (const post of posts) {
    const { uid, locale, title } = post.data;
    if (!uid) continue;

    let byLocale = index.get(uid);
    if (!byLocale) {
      byLocale = new Map();
      index.set(uid, byLocale);
    }
    if (byLocale.has(locale)) {
      throw new Error(
        `Duplicate canonical id "${uid}" in locale "${locale}": more than one ` +
          `post declares it. A uid must map to a single post per locale.`
      );
    }
    byLocale.set(locale, { slug: localeStrippedSlug(post.id, locale), title });
  }
  return index;
}

/** Strip an optional `post:` prefix from a uid reference (`post:foo` → `foo`). */
export function normalizeUid(ref: string): string {
  return ref.startsWith('post:') ? ref.slice('post:'.length) : ref;
}

let cachedIndex: Map<string, Map<string, ResolvedPost>> | null = null;

/** Load and cache the uid index from the blog collection (drafts excluded). */
async function getUidIndex(): Promise<Map<string, Map<string, ResolvedPost>>> {
  if (cachedIndex) return cachedIndex;
  const { getCollection } = await import('astro:content');
  const posts = (await getCollection('blog')).filter(
    (post) => post.data.draft !== true
  );
  cachedIndex = buildUidIndex(posts);
  return cachedIndex;
}

/**
 * Build-time guard: validate every canonical id (throws on duplicates). Runs
 * regardless of whether any <PostLink> is rendered, so uid integrity is always
 * checked. Call from a route's `getStaticPaths`.
 */
export async function assertValidPostUids(): Promise<void> {
  await getUidIndex();
}

/**
 * Resolve a canonical id to a locale-aware URL and the target post's title.
 * Throws when the id is unknown (a broken internal link) so the build fails
 * loudly. Falls back to the default-locale variant when the requested locale
 * has no translation of the post.
 */
export async function resolvePostUrl(
  ref: string,
  locale: string = defaultLocale
): Promise<{ url: string; title: string }> {
  const uid = normalizeUid(ref);
  const index = await getUidIndex();

  const byLocale = index.get(uid);
  if (!byLocale) {
    throw new Error(
      `<PostLink>: unknown canonical id "${uid}". No published blog post ` +
        `declares uid: "${uid}" — add it to the target post's frontmatter, or ` +
        `fix the reference.`
    );
  }

  const resolved = byLocale.get(locale) ?? byLocale.get(defaultLocale);
  if (!resolved) {
    throw new Error(
      `<PostLink>: canonical id "${uid}" has no variant for locale "${locale}".`
    );
  }

  return {
    url: localizedPath(`/blog/${resolved.slug}`, locale),
    title: resolved.title,
  };
}
