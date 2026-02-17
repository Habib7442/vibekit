import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const userId = searchParams.get("userId");
  const credits = searchParams.get("credits");

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const bearerToken = process.env.DODO_PAYMENTS_API_KEY!;
  const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL!;
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";
  
  const isTest = environment === "test_mode";
  const apiUrl = isTest 
    ? "https://test.dodopayments.com/api/v1/checkout"
    : "https://api.dodopayments.com/api/v1/checkout";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: 1,
        return_url: returnUrl,
        metadata: {
          user_id: userId,
          credits: credits
        },
        customer: {
          external_id: userId
        }
      }),
    });

    const data = await response.json();
    
    if (data.url) {
      return NextResponse.redirect(data.url);
    } else {
      console.error("Dodo Checkout Error:", data);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }
  } catch (error) {
    console.error("Checkout Request Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
