export const config = {
  mapBoxAccessToken: getEnvVar("VITE_MAPBOX_ACCESS_TOKEN"),
};

function getEnvVar(name: string): string | null {
  const value = import.meta.env[name];
  if (!value) {
    console.error(`Missing environment variable: ${name}`);
    return null;
  }
  return value;
}
