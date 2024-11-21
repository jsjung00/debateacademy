import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file[]");

    console.log(
      "Files to upload:",
      files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        isBlob: f instanceof Blob,
        isFile: f instanceof File,
      }))
    );

    // upload pdf files to gemini storage
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

    const formDatas = files.map((file) => {
      const formData = new FormData();
      const metadata = {
        file: {
          mimeType: file.type,
          displayName: file.name,
        },
      };
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], {
          contentType: "application/json",
        })
      );
      formData.append("file", file);
      return formData;
    });

    //for (const itItem of formDatas[0].entries()) {
    //  console.log(itItem);
    //}

    const responses = await Promise.all(
      formDatas.map((formData) =>
        fetch(
          `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${fileManager.apiKey}`,
          { method: "post", body: formData }
        ).then((response) => {
          if (!response.ok) {
            return response.json().then((errorData) => {
              throw new Error(`Upload failed ${JSON.stringify(errorData)}`);
            });
          }
          return response.json();
        })
      )
    );

    responses.forEach((res) => console.log(res));

    /*console.log(
        `Uploaded file ${res.file.displayName} as ${res.file.uri} with type ${res.file.mimeType}`
      );*/

    // double check that files uploaded

    const getResponses = await Promise.all(
      responses.map((response) => fileManager.getFile(response.file.name))
    );
    console.log("responses", getResponses);

    return NextResponse.json(
      {
        success: true,
        fileDatas: responses.map((response) => ({
          fileUri: response.file.uri,
          mimeType: "application/pdf",
        })),
        message: "Successfully uploaded files to gemini storage.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading files to gemini", error);
    return NextResponse.json(
      { message: `Failed to upload files to gemini ${error.message}` },
      { status: 500 }
    );
  }
}
