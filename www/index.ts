const prodUrl = "https://api.linkio.world";
const devUrl = "http://localhost:5505";

export const server = process.env.NODE_ENV === "development" ? devUrl : prodUrl;

// SEP-24 anchor server
export const anchorUrl = process.env.NODE_ENV === "development"
  ?"http://localhost:8000/sep24"
  : "https://anchor.linkio.world/sep24";
