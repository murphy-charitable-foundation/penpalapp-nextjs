const DAY_MS = 24 * 60 * 60 * 1000;

export function timestampMillis(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") value = value.toDate();
  if (value == null) return NaN;
  return new Date(value).getTime();
}

export function isReminderDue(conversation, reason, now = new Date()) {
  if (!conversation || conversation.deleted_at != null) return false;
  const days = reason === "user" ? 14 : reason === "admin" ? 28 : null;
  if (!days) return false;
  const messageAt = timestampMillis(conversation.latest_message_created_at);
  if (!Number.isFinite(messageAt)) return false;
  const remindedAt = timestampMillis(conversation[`${reason}_reminded_at`]);
  const since = Number.isFinite(remindedAt) ? Math.max(messageAt, remindedAt) : messageAt;
  return timestampMillis(now) - since >= days * DAY_MS;
}
