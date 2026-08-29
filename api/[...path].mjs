// Vercel discovers files in the root `api` directory as serverless functions.
// Keep the implementation in one place so Netlify and Vercel behave the same
// while the site is being migrated.
import handler from "../netlify/functions/api.mjs";

export default {
  fetch(request) {
    return handler(request);
  },
};
