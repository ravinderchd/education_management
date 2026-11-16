/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every EduManage page depends on the logged-in user, so pages are rendered
  // per request (classic dynamic rendering) instead of using Cache Components.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
