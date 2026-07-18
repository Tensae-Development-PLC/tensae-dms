function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
export function inviteEmailTemplate(input) {
    const subject = `You're invited to join ${input.companyName}`;
    const text = [
        `You have been invited to join ${input.companyName}.`,
        `Role: ${input.role}`,
        input.department ? `Department: ${input.department}` : null,
        input.expiryDate ? `Expires on: ${input.expiryDate}` : null,
        `Invited by: ${input.invitedBy}`,
        `Accept your invitation: ${input.inviteUrl}`,
    ].filter(Boolean).join("\n");
    const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px">You have been invited to ${escapeHtml(input.companyName)}</h2>
      <p style="margin:0 0 8px">Role: <strong>${escapeHtml(input.role)}</strong></p>
      ${input.department ? `<p style="margin:0 0 8px">Department: <strong>${escapeHtml(input.department)}</strong></p>` : ''}
      ${input.expiryDate ? `<p style="margin:0 0 8px">Expires on: <strong>${escapeHtml(input.expiryDate)}</strong></p>` : ''}
      <p style="margin:0 0 8px">Invited by: ${escapeHtml(input.invitedBy)}</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(input.inviteUrl)}" style="background:#111827;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">Accept invitation</a>
      </p>
      <p style="margin:0;color:#6b7280;font-size:12px">If you weren't expecting this email, you can ignore it.</p>
    </div>
  `;
    return { subject, text, html };
}
export function passwordResetTemplate(input) {
    const subject = `Reset your ${input.appName} password`;
    const text = `Reset your password here: ${input.resetUrl}`;
    const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px">Reset your password</h2>
      <p style="margin:0 0 8px">Click the button below to reset your password.</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(input.resetUrl)}" style="background:#111827;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">Reset password</a>
      </p>
    </div>
  `;
    return { subject, text, html };
}
