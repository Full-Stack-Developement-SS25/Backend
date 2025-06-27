# Backend

## Premium Endpoints

* `GET /api/user/:id/premium` – gibt den Premium-Status eines Users zurueck
  ```json
  { "isPremium": true }
  ```
* `POST /api/user/:id/premium/buy` – setzt `is_premium` fuer Testzwecke auf `true`
  ```json
  { "isPremium": true }
  ```

