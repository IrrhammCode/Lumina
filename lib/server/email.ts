type NewRequestEmailInput = {
  memberName: string;
  relation: string;
  title: string;
  amount: number;
  message: string;
};

async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Lumina <onboarding@resend.dev>";
  if (!apiKey) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendNewRequestEmail(
  sponsorEmail: string,
  input: NewRequestEmailInput
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const subject = `${input.memberName} asked for $${input.amount.toFixed(0)} — Lumina`;
  const text = [
    `${input.memberName} (${input.relation}) sent a new care request.`,
    "",
    `Need: ${input.title}`,
    `Amount: $${input.amount.toFixed(2)}`,
    input.message ? `Message: ${input.message}` : "",
    "",
    `Review and approve: ${appUrl}/requests`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail(sponsorEmail, subject, text);
}

export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  return sendEmail(
    email,
    "Your Lumina sign-in code",
    `Your Lumina verification code is ${code}. It expires in 10 minutes.`
  );
}