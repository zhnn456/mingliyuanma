# [OPEN] login-401-error - Debug Session

## Symptoms
- 401 Unauthorized on `/api/auth/login` for existing user `282063152@qq.com`
- 400 Bad Request on `/api/user/register` 
- Database operations may not be working after Cloudflare deployment

## Status
- Investigating

## Hypotheses
1. Cloudflare D1 remote database is empty (no tables or no user data) — data only exists in local DB
2. Password verification failing due to our changes to `crypto.subtle.exportKey` API
3. User registration failing because D1 tables don't exist on remote database
4. `getSession` cannot find user in D1 query, returning 401
5. Register endpoint validation rejecting email format or missing fields

## Evidence
- [ ] Need to verify D1 table existence on Cloudflare
- [ ] Need to verify user data exists in D1
- [ ] Need to test password hash verification
- [ ] Need to check register endpoint logic

## Next Steps
- Check D1 database schema and data on Cloudflare
- Review login/register route code
- Add instrumentation to login endpoint
