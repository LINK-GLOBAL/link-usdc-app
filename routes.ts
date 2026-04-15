/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */

export const publicRoutes = [
  "/",
  "/buy",
  "/sell",
  "/sell/options",
  "/auth/secure",
  "/menu",
  "/converter/buy",
  "/converter/sell",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /home
 * @type {string[]}
 */

export const authRoutes = ["/auth/login"];

/**
 * The default rediret path after loggin in
 * @type {string}
 */

export const DEFAULT_LOGIC_REDIRECT = "/buy";
