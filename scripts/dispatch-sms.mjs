import 'dotenv/config';
import pg from 'pg';
import { sendMelliPattern } from '../src/lib/sms.ts';
import { processOrderPaymentVerification } from '../src/lib/payment.ts';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const maxRetries = Math.min(10, Math.max(1, Number(process.env.SMS_MAX_RETRIES || 5)));
async function claim() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM sms_notifications WHERE status IN ('pending','retry_pending') AND next_attempt_at <= now() ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1`);
    if (!rows.length) { await client.query('COMMIT'); return null; }
    const item = rows[0];
    await client.query(`UPDATE sms_notifications SET status='processing', last_attempt_at=now(), retry_count=retry_count+1 WHERE id=$1`, [item.id]);
    await client.query('COMMIT');
    return item;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
try {
  // Reconcile pending bank attempts even if the buyer closed the browser before redirect.
  // Each claim delays another inquiry by five minutes; reconciliation never sends SMS directly.
  const { rows: pending } = await pool.query(`WITH due AS (
    SELECT a.id FROM payment_attempts a JOIN orders o ON o.id=a.order_id
    WHERE a.status='pending' AND o.payment_status<>'paid' AND a.created_at < now()-interval '2 minutes'
      AND a.updated_at < now()-interval '5 minutes'
    ORDER BY a.id FOR UPDATE OF a SKIP LOCKED LIMIT 10
  ) UPDATE payment_attempts a SET updated_at=now() FROM due WHERE a.id=due.id
  RETURNING a.order_id, a.track_id, a.provider`);
  for (const attempt of pending) {
    try {
      const { rows: [order] } = await pool.query(`SELECT tracking_code FROM orders WHERE id=$1`, [attempt.order_id]);
      if (order) await processOrderPaymentVerification(order.tracking_code, attempt.track_id, undefined, attempt.provider);
    } catch (error) { console.error('[SMS] payment reconciliation failed', { orderId: attempt.order_id, error: error instanceof Error ? error.message : 'unknown' }); }
  }
  // A crash during the provider call is ambiguous: never automatically resend.
  await pool.query(`UPDATE sms_notifications SET status='failed', last_error='uncertain_processing_interruption' WHERE status='processing' AND last_attempt_at < now() - interval '2 minutes'`);
  for (let i = 0; i < 50; i++) {
    const item = await claim();
    if (!item) break;
    if (item.kind === 'payment_failed' || item.kind === 'order_shipped') {
      const { rows: [state] } = await pool.query(`SELECT o.payment_status, o.status AS order_status, o.shipping_code, a.status AS attempt_status FROM orders o LEFT JOIN payment_attempts a ON a.id=$2 WHERE o.id=$1`, [item.order_id, item.payment_attempt_id]);
      const superseded = !state || (item.kind === 'payment_failed' && (state.payment_status === 'paid' || state.attempt_status !== 'failed')) || (item.kind === 'order_shipped' && (state.order_status === 'cancelled' || state.shipping_code !== item.parameters[1]));
      if (superseded) {
        await pool.query(`UPDATE sms_notifications SET status='permanently_failed', last_error='event_superseded' WHERE id=$1 AND status='processing'`, [item.id]);
        continue;
      }
    }
    const result = await sendMelliPattern(item.recipient, item.body_id, item.parameters);
    const retryable = !result.success && result.retryable && item.retry_count + 1 < maxRetries;
    const status = result.success ? 'sent' : result.uncertain ? 'failed' : retryable ? 'retry_pending' : 'permanently_failed';
    const delay = Math.min(3600, 30 * 2 ** item.retry_count);
    await pool.query(`UPDATE sms_notifications SET status=$2, provider_message_id=$3, last_error=$4, sent_at=CASE WHEN $2='sent' THEN now() ELSE sent_at END, next_attempt_at=now()+$5::integer * interval '1 second' WHERE id=$1 AND status='processing'`, [item.id, status, result.messageId || null, result.error || null, delay]);
    console.log('[SMS]', { id: item.id, kind: item.kind, status });
  }
} finally { await pool.end(); }
