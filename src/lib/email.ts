import { Resend } from "resend";
import QRCode from "qrcode";
import { formatDate, formatPrice } from "./utils";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

export async function sendReservationConfirmationEmail({
  to,
  userName,
  eventName,
  eventDate,
  eventLocation,
  spotLabels,
  totalPrice,
  qrToken,
  reservationId,
}: {
  to: string;
  userName: string | null;
  eventName: string;
  eventDate: Date;
  eventLocation: string;
  spotLabels: string[];
  totalPrice: number;
  qrToken: string;
  reservationId: string;
}) {
  const qrDataUrl = await QRCode.toDataURL(
    `${process.env.NEXTAUTH_URL}/reservations/${reservationId}/ticket`,
    { width: 200, margin: 2 }
  );

  const spotsHtml = spotLabels
    .map(
      (l) =>
        `<span style="background:#fef3c7;border:1px solid #f59e0b;padding:4px 10px;border-radius:20px;font-size:14px;margin:2px;display:inline-block">${l}</span>`
    )
    .join(" ");

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Réservation confirmée</title></head>
<body style="font-family:system-ui,sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#d97706;padding:24px 32px">
      <h1 style="color:white;margin:0;font-size:22px">🎉 Réservation confirmée !</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:16px;margin:0 0 20px">Bonjour ${userName ?? ""},</p>
      <p style="color:#374151;margin:0 0 20px">Votre réservation pour <strong>${eventName}</strong> est confirmée.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:20px">
        <p style="margin:0 0 8px;color:#92400e;font-size:14px">📍 ${eventLocation}</p>
        <p style="margin:0 0 12px;color:#92400e;font-size:14px">📅 ${formatDate(eventDate)}</p>
        <p style="margin:0 0 8px;color:#374151;font-size:13px;font-weight:600">Emplacement(s) :</p>
        <div style="margin-bottom:8px">${spotsHtml}</div>
        <p style="margin:8px 0 0;color:#374151;font-size:14px;font-weight:600">Total : ${formatPrice(totalPrice)}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <p style="color:#6b7280;font-size:13px;margin-bottom:8px">Votre billet — à présenter le jour J</p>
        <img src="${qrDataUrl}" alt="QR Code" style="width:160px;height:160px" />
        <p style="color:#9ca3af;font-size:11px;margin-top:8px">Token : ${qrToken.slice(0, 12)}…</p>
      </div>
      <div style="text-align:center;margin-top:24px">
        <a href="${process.env.NEXTAUTH_URL}/reservations/${reservationId}/ticket"
           style="background:#d97706;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Voir mon billet
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center">
      <p style="color:#9ca3af;font-size:12px;margin:0">Gestion Brocante · Ne pas répondre à cet email</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `✅ Réservation confirmée — ${eventName}`,
      html,
    });
  } catch (err) {
    // Email failure must not block the reservation confirmation
    console.error("Email send failed:", err);
  }
}
