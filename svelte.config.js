import adapter from '@sveltejs/adapter-static';

const config = {
  compilerOptions: {
    runes: true
  },
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false
    }),
    paths: {
      base: process.env.NODE_ENV === 'production' ? '/practice' : ''
    }
  }
};

export default config;