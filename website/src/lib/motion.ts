/** Keep these queries aligned with the static layouts in mobile.css. */
export const MOBILE_QUERY = '(max-width: 900px), (hover: none) and (pointer: coarse)';
export const STATIC_MOTION_QUERY = `${MOBILE_QUERY}, (prefers-reduced-motion: reduce)`;
export const DESKTOP_MOTION_QUERY = '(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
