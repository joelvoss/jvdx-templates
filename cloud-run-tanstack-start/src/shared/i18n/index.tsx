// NOTE(joel): `~/shared/i18n` is the app-facing i18n layer.
// Keep React-aware and cross-runtime helpers here, including the provider,
// script hydration helpers, rich message rendering, `translations()`, and
// `useTranslations()`.
// `translations()` stays here because it composes `~/lib/i18n` primitives into
// the `t()/rich()/markup()/raw()` API used by routes and components.

export * from "~/shared/i18n/components";
export * from "~/shared/i18n/format";
export * from "~/shared/i18n/translations";
export * from "~/shared/i18n/hooks";
