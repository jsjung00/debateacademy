import { NextRequest, NextResponse } from "next/server";
import { createPresignedUploadUrl, getPublicUrl } from "@/lib/s3";

export async function POST(request) {
  try {
    const body = await request.json();
    const fileNames = body.fileNames;

    if (!fileNames) {
      return NextResponse.json(
        { message: "fileNames are required" },
        { status: 400 }
      );
    }
    // dictionary of {url, key} objects
    const urlsAndKeys = await Promise.all(
      fileNames.map((fileName) => createPresignedUploadUrl(fileName))
    );

    const uploadUrls = urlsAndKeys.map((obj) => obj.url);
    const fileUrls = urlsAndKeys.map((obj) => getPublicUrl(obj.key));

    return NextResponse.json({
      uploadUrls: uploadUrls,
      fileUrls: fileUrls,
    });
  } catch (error) {
    console.error("Error generating signed URL", error);
    return NextResponse.json(
      { message: "Error generating upload URL" },
      { status: 500 }
    );
  }
}
