import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteVerification = env.VITE_GOOGLE_SITE_VERIFICATION?.trim();

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-seo-meta',
        transformIndexHtml(html: string) {
          if (!siteVerification) return html;
          return html.replace(
            '<meta name="robots" content="index, follow" />',
            `<meta name="google-site-verification" content="${siteVerification}" />\n    <meta name="robots" content="index, follow" />`
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
