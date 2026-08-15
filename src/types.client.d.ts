/**
 * Type surface for the built browser entry (`lib/client.js`), the standard
 * Cordis function-plugin face the DSH client loader materializes from
 * `/plugins/dsh-cyberpunk-theme/client.js`.
 */
import type { Context } from '@deepseek-ai/cordis'

/** Stable Cordis plugin name (the cordis.patch.yml entry id). */
export declare const name: string

/**
 * Hard dependencies: slots + theme are mandatory for the reskin; timer keeps
 * the status-strip clock and heartbeat running (always present in web
 * compositions via the cordis client runner).
 */
export declare const inject: string[]

/** Mount the theme: bridges + token overrides + CSS + slot registrations. */
export declare function apply(ctx: Context): void
