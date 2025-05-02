// pages/api/cloudinary-signature.ts  (or .js)
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from "next/server";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Interface for type safety (optional but recommended)
interface CloudinarySignatureRequest {
    public_id: string;
    timestamp: number;
    resource_type: string;
    eager?: string;
}


export async function POST(req: Request) { // Correctly type req
    try {
        const body: CloudinarySignatureRequest = await req.json(); // Type the body
        const { public_id, timestamp, resource_type, eager } = body; // Destructure after type assertion

        const signature = cloudinary.utils.api_sign_request(
            { public_id, timestamp, resource_type, eager },
            process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET!
        );

       // console.log('signature', signature);
        return NextResponse.json({ signature }); // Use NextResponse.json

    } catch (error) {
        console.error("Signature generation error:", error);
        return new NextResponse("Failed to generate signature", { status: 500 }); // More informative error response
    }
}

