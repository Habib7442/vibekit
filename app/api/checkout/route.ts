import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const productId = searchParams.get("productId");
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");
  const credits = searchParams.get("credits");
  const plan = searchParams.get("plan");

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  // Fallback to origin + /studio if return URL is missing
  const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL || `${origin}/studio`;
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";
  
  if (!bearerToken) {
    console.error("[Checkout] CRITICAL: DODO_PAYMENTS_API_KEY is missing");
    return NextResponse.json({ error: "Server configuration error - API Key missing" }, { status: 500 });
  }
  
  const isTest = environment === "test_mode";
  const apiUrl = isTest 
    ? "https://test.dodopayments.com/checkouts"
    : "https://live.dodopayments.com/checkouts";

  console.log(`[Checkout] Creating checkout for user ${userId}, product ${productId}, env: ${environment}`);

  try {
    const payload = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        }
      ],
      return_url: returnUrl,
      ...(userId && {
        metadata: {
          user_id: userId,
          ...(credits && { credits: String(credits) }),
          ...(plan && { plan: String(plan) })
        },
        customer: {
          external_id: userId,
          ...(email && { email })
        }
      })
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Checkout] Dodo API Error (${response.status}):`, errorText);
      
      let errorDetail = "Payment service error";
      try {
        const errJson = JSON.parse(errorText);
        errorDetail = errJson.message || errJson.error || errorDetail;
      } catch (pErr) {}

      return NextResponse.json({ 
        error: "Payment service error", 
        detail: errorDetail 
      }, { status: 502 });
    }

    const data = await response.json();
    
    if (data.checkout_url) {
      console.log(`[Checkout] Successfully created session, redirecting to: ${data.checkout_url}`);
      return NextResponse.redirect(new URL(data.checkout_url), 303);
    } else {
      console.error("[Checkout] Dodo Checkout Error: No URL returned", data);
      return NextResponse.json({ error: "Failed to create checkout session - missing URL" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[Checkout] Exception during checkout creation:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message 
    }, { status: 500 });
  }
}
