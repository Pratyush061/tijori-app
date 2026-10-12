/**
 * Build-time switches for development.
 *
 * DEV_UNLOCK turns on a "skip the passcode" path that exists only so the app
 * can be opened quickly while debugging. Keep it `false` here: the
 * "Dev unlock APK" workflow rewrites this file to `true` for its own build
 * only, so a normal release APK can never carry the bypass.
 */
export const DEV_UNLOCK = false;
