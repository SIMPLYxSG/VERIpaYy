# AssetTrack Frontend

Next.js (Pages Router) client for the AssetTrack API contract.

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Contract rules this client follows

- All HTTP calls go through `src/services/api.ts`
- JSON fields remain snake_case (`asset_id`, `location_id`, `last_seen`, …)
- Routes match the Master Project Contract
- WebSocket client uses `/ws/location-updates`
- Mock fallback uses the same envelope: `{ success, data, message }`
