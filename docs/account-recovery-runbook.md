# Account Recovery Runbook

## Purpose
This runbook defines how support handles panic-mode reinstatement requests safely.

## Verification Policy
- Require the request to come from the account email address.
- Require the exact three-word recovery key.
- Do not disclose whether an account exists until both checks pass.

## Reinstatement Endpoint
- Method: `POST`
- Path: `/api/internal/account/reinstate`
- Header: `Authorization: Bearer <SUPPORT_RECOVERY_API_KEY>`
- Payload:

```json
{
  "account_email": "user@example.com",
  "sender_email": "user@example.com",
  "recovery_key": "cedar wave stone"
}
```

## Outcome Rules
- If a valid snapshot exists and is unexpired (30-day retention): restore core account data.
- If no valid snapshot exists (expired or purged): reinstate as empty account.
- After successful reinstatement: user is unbanned, password is rotated, reset email is sent.

## Expected User Comms (After Success)
Use this template:

"Your account has been reinstated. For security, we reset your password and sent a reset email to this address. Please reset your password and sign in again."

## Audit and Monitoring
- Every reinstatement attempt is written to `private.account_recovery_audit`.
- Monitor repeated failures for the same account/email pair.
- Suggested alert query (run periodically):

```sql
select user_id, actor_email, count(*) as failed_attempts
from private.account_recovery_audit
where action = 'reinstate'
  and outcome = 'failed'
  and created_at >= now() - interval '24 hours'
group by user_id, actor_email
having count(*) >= 3;
```

## Recovery Snapshot Retention
- Snapshots are retained for 30 days.
- Expired snapshots are purged by daily cron job.
