/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/authentication/login',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
