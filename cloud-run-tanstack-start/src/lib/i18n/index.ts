// NOTE(joel): `~/lib/i18n` is the low-level i18n layer.
// Keep framework-agnostic primitives here: locale parsing, ICU formatting,
// config, and request/runtime helpers. App-facing helpers that compose these
// primitives into a React-oriented API belong in `~/shared/i18n` instead.

export * from "~/lib/i18n/config";
export * from "~/lib/i18n/format";
export * from "~/lib/i18n/locale";
export * from "~/lib/i18n/routing";
export * from "~/lib/i18n/runtime";
