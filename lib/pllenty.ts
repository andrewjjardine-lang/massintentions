/**
 * Pllenty payment integration.
 *
 * Pllenty uses API/flat-file workflow automation. Replace the stubs below
 * with the actual Pllenty API endpoint, credentials, and payload format
 * once you receive the integration documentation.
 *
 * Expected env vars:
 *   PLLENTY_API_URL   – base URL for Pllenty API
 *   PLLENTY_API_KEY   – your merchant API key
 */

export interface PllentyChargeRequest {
  amountCents: number;
  description: string;
  customerName: string;
  customerEmail: string;
  /** Opaque reference stored on the intention record for reconciliation */
  referenceId: string;
}

export interface PllentyChargeResult {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string; // redirect URL if Pllenty uses a hosted payment page
  error?: string;
}

export async function createPllentyCharge(
  req: PllentyChargeRequest
): Promise<PllentyChargeResult> {
  const apiUrl = process.env.PLLENTY_API_URL;
  const apiKey = process.env.PLLENTY_API_KEY;

  if (!apiUrl || !apiKey) {
    // Fail gracefully in dev so the rest of the app still works
    console.warn("Pllenty credentials not configured — returning mock response");
    return {
      success: true,
      paymentId: `mock_${Date.now()}`,
      checkoutUrl: undefined,
    };
  }

  const response = await fetch(`${apiUrl}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount: req.amountCents,
      currency: "usd",
      description: req.description,
      customer_name: req.customerName,
      customer_email: req.customerEmail,
      reference_id: req.referenceId,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { success: false, error: `Pllenty error ${response.status}: ${body}` };
  }

  const data = await response.json();

  return {
    success: true,
    paymentId: data.id ?? data.payment_id,
    checkoutUrl: data.checkout_url,
  };
}
