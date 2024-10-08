import { type NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { type PhoneNumber } from "~/api/queries";

export async function sendPayout(
  amount: number,
  phoneNumber: PhoneNumber,
): Promise<DotsPayoutResponse> {
  const apiUrl = "https://pls.senddotssandbox.com/api/v2/payouts/send-payout";
  const authToken = process.env.DOTS_API_TOKEN;
  const clientId = process.env.CLIENT_ID;
  if (!authToken || !clientId) {
    throw new Error("API token and/or client ID are required in .env");
  }
  const authHeader = `Basic ${Buffer.from(`${clientId}:${authToken}`).toString("base64")}`;
  const idempotencyKey = uuidv4();
  const payload = {
    amount,
    payee: {
      country_code: phoneNumber.country_code,
      phone_number: phoneNumber.phone_number,
    },
    // can add a memo to send with the payout link
    // delivery: {
    //   message: memo,
    // },
    force_collect_compliance_information: true,
    // can add some some other thigs later
    //additional_steps: ["compliance"], // can add onto this with stuff like background check later
    tax_exempt: true, //change to false in prod
    idempotency_key: idempotencyKey,
    payout_fee_party: "platform",
  };

  const options = {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  try {
    const response = await fetch(apiUrl, options);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    return (await response.json()) as DotsPayoutResponse;
  } catch (err) {
    console.error("Error sending payout:", err);
    throw new Error("Error sending payout");
  }
}

// Route handler for sending payout
export async function POST(request: NextRequest) {
  try {
    console.log("Request received for sending payout");

    const requestData = await request.json();
    const { amount, phoneNumber } = requestData;

    if (!amount || !phoneNumber) {
      throw new Error("Missing required fields");
    }

    console.log("Request data parsed:", requestData);

    const result = await sendPayout(
      amount as number,
      phoneNumber as PhoneNumber,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in POST handler for sending payout:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Define the type for the response
type DotsPayoutResponse = {
  id: string;
  created: string;
  link: string;
  amount: number;
  status: string;
  payee: {
    first_name: string;
    last_name: string;
    email: string;
    country_code: string;
    phone_number: string;
  };
  delivery: {
    method: string;
    email: string;
    country_code: string;
    phone_number: string;
  };
  tax_exempt: boolean;
  claimed_user_id: string;
  flow_id: string;
  metadata: string;
};
