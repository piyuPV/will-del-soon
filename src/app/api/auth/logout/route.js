import {NextResponse} from "next/server";

export async function GET() {

  try {
    const response = NextResponse.json({ message: "Logged out successfully", status:200 });

    // Remove the token from cookies by setting it with an empty value and an expired date
    response.cookies.set("token", "", { path: "/", expires: new Date(0) });

    return response;
  } catch (error) {
    console.log("error: ", error);
    return NextResponse.json({ error:error || "Unknown Error" }, { status: 500 });
  }
}