
# Fix: Norce proxy fungerar inte pa publicerad sida

## Problem
Edge Function-anropet blockeras av JWT-verifiering pa gateway-niva innan koden ens kor. Lovable Cloud anvander ett signing-keys-system som inte ar kompatibelt med standardinstallningen `verify_jwt = true`. Dessutom saknas CORS-headers for de extra headers som Supabase-klienten skickar.

## Losning

### 1. Lagg till `verify_jwt = false` i config.toml
Lagg till konfiguration for norce-proxy-funktionen sa att JWT-verifiering sker i koden istallet for pa gateway-niva (funktionen har redan egen auth-validering med `getUser()`):

```toml
[functions.norce-proxy]
verify_jwt = false
```

### 2. Uppdatera CORS-headers i edge function
Lagg till de headers som Supabase JS-klienten skickar automatiskt:

```
authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

## Tekniska detaljer
- `verify_jwt = false` stanger av gateway-niva JWT-kontroll. Sakerhet bibehalls genom att funktionen validerar anvandaren med `supabase.auth.getUser()` i koden.
- CORS-uppdateringen behoves for att webblasar-preflight (OPTIONS) inte ska blockera anropet nar Supabase SDK skickar extra headers.
- Inga andra filandringar behoves -- klientkoden i `src/integrations/norce/client.ts` ar korrekt.
