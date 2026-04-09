/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/covers\.openlibrary\.org\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'book-covers',
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/openlibrary\.org\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'open-library-api',
        expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/www\.googleapis\.com\/books\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-books-api',
        expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/api\.quotable\.io\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'quotes-api',
        expiration: { maxEntries: 50, maxAgeSeconds: 6 * 60 * 60 },
      },
    },
  ],
});

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'books.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

module.exports = withPWA(nextConfig);
