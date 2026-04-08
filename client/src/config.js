// Résolution dynamique de l'URL API :
// - Si VITE_API_URL est défini (prod/staging) → on l'utilise
// - Sinon → même hostname que l'app, port 3001 (fonctionne depuis mobile sur le réseau local)
export const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`
