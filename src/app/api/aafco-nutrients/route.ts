import { getAafcoNutrient } from "@/lib/strapi";
import { NextResponse } from "next/server";

// THIS WAS AN EXAMPLE OF HOW TO FETCH FROM STRAPI BUT KEEP IT IN A SERVER SIDE API ROUTE

/**
 * Example server-side usage of your Strapi API token.
 * Fetches AAFCO guidelines (single type) and returns only hasData (never the actual data to the client).
 *
 * In real use, call getAafcoNutrient() inside your recipe-generation logic and use
 * the min values (calcium, vitamin A, etc.) there; never send the raw guidelines to the client.
 */
export async function GET() {
  try {
    const data = await getAafcoNutrient();
    return NextResponse.json({
      ok: true,
      hasData: data.length > 0,
      // data: data, // TAKE THIS OUT LATER
    });
  } catch (e) {
    console.error("AAFCO fetch failed:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to load guidelines" },
      { status: 500 }
    );
  }
}
