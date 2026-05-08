function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  var body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (error) {
      res.status(400).json({ ok: false, error: "Invalid JSON payload." });
      return;
    }
  }

  var email = String((body && body.email) || "").trim();
  var name = String((body && body.name) || "").trim() || "Patient";
  var date = String((body && body.date) || "").trim();
  var time = String((body && body.time) || "").trim();
  var service = String((body && body.service) || "").trim() || "Dental appointment";
  var confirmationCode = String((body && body.confirmationCode) || "").trim();

  if (!email) {
    res.status(400).json({ ok: false, error: "Recipient email is required." });
    return;
  }

  var apiKey = process.env.RESEND_API_KEY;
  var fromEmail = process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    res.status(500).json({ ok: false, error: "Email service is not configured." });
    return;
  }

  var clinicName = process.env.CLINIC_NAME || "Dr. Muhammad Usman Ghani Dental Clinic";
  var clinicPhone = process.env.CLINIC_PHONE || "03444884014";
  var replyTo = process.env.REPLY_TO_EMAIL || fromEmail;

  var subject = "Appointment Confirmed - " + clinicName;
  var codeLine = confirmationCode ? "\n- Confirmation Code: " + confirmationCode : "";

  var textBody =
    "Hello " + name + ",\n\n" +
    "Your appointment has been confirmed.\n\n" +
    "Details:\n" +
    "- Service: " + service + "\n" +
    "- Date: " + (date || "TBD") + "\n" +
    "- Time: " + (time || "TBD") +
    codeLine +
    "\n\n" +
    "If you need to reschedule, please call " + clinicPhone + ".\n\n" +
    "Regards,\n" +
    clinicName + "\n" +
    "Phone: " + clinicPhone;

  var htmlBody =
    "<p>Hello " + escapeHtml(name) + ",</p>" +
    "<p>Your appointment has been confirmed.</p>" +
    "<p><strong>Details</strong></p>" +
    "<ul>" +
    "<li>Service: " + escapeHtml(service) + "</li>" +
    "<li>Date: " + escapeHtml(date || "TBD") + "</li>" +
    "<li>Time: " + escapeHtml(time || "TBD") + "</li>" +
    (confirmationCode ? "<li>Confirmation Code: " + escapeHtml(confirmationCode) + "</li>" : "") +
    "</ul>" +
    "<p>If you need to reschedule, please call " + escapeHtml(clinicPhone) + ".</p>" +
    "<p>Regards,<br>" + escapeHtml(clinicName) + "<br>Phone: " + escapeHtml(clinicPhone) + "</p>";

  try {
    var response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: subject,
        text: textBody,
        html: htmlBody,
        reply_to: replyTo
      })
    });

    var result = await response.json();
    if (!response.ok) {
      res.status(502).json({ ok: false, error: result && result.message ? result.message : "Resend API error." });
      return;
    }

    res.status(200).json({ ok: true, id: result.id || null });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to send email." });
  }
};
