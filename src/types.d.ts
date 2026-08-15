/**
 * Type surface for the built host entry (`lib/index.js`, package main).
 * The host half is a no-op loader-entry plugin; the theme is a pure browser
 * concern implemented by `./types.client.d.ts`'s client half.
 */
import type { Context } from '@deepseek-ai/cordis'

/** Stable Cordis plugin name (the cordis.patch.yml entry id). */
export declare const name: string

/** No-op plugin body. */
export declare function apply(ctx: Context): void
