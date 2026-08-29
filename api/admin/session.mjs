import handler from "../../netlify/functions/api.mjs";

export default {
  fetch(request) {
    return handler(request);
  },
};
