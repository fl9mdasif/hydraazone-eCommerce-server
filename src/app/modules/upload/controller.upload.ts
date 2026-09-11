import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import httpStatus from 'http-status'; // Or use numeric codes directly

// Initialize S3 Client (Make sure AWS env vars are loaded)
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const generateUploadUrl = async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;

    // Basic Validation
    if (!filename || !contentType) {
      return res.status(httpStatus.BAD_REQUEST).json({
         success: false,
         message: 'Filename and contentType are required'
      });
    }

    // Sanitize filename and create unique key
    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-'); // Replace unsafe characters
    const uniqueKey = `uploads/images/${uuidv4()}-${safeFilename}`; // Define your folder structure

    // Prepare S3 command
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: uniqueKey,
      ContentType: contentType,
      // ACL: 'public-read' // Optional: Uncomment if you want files public by default
    });

    // Generate the pre-signed URL (valid for 10 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    // Construct the final, permanent URL of the file
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${uniqueKey}`;

    // Send successful response
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Upload URL generated successfully',
      data: {
        uploadUrl: uploadUrl, // Temporary URL for PUT request
        fileUrl: fileUrl,     // Permanent URL to save in DB
      },
    });

  } catch (error: any) {
    console.error("❌ Error generating S3 pre-signed URL:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
       success: false,
       message: 'Failed to generate upload URL',
       error: error.message
    });
  }
};