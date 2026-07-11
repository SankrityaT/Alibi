/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // The codebase's local modules use explicit `.js` extensions on import
    // specifiers (the TS "NodeNext"-style convention), even though the
    // files on disk are `.ts`/`.tsx`. Vitest's esbuild-based resolver
    // already handles this transparently, but webpack does not by default,
    // so `.js` specifiers pointing at `.ts`/`.tsx` files (e.g.
    // `StationCanvas.js` -> `StationCanvas.tsx`) fail to resolve. This
    // extension alias makes webpack try the TypeScript source when a
    // `.js`-suffixed import can't be found as a literal `.js` file.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.js', '.ts', '.tsx']
    }
    return config
  }
}

export default nextConfig
