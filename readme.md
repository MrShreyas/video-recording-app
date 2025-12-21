I’ve combined the logical flow of setup, security configurations, and deployment commands into a single document.

Markdown

# Video Recording App

A comprehensive web application for recording, trimming, and managing video content. This project uses **FFmpeg** for client-side video processing and **AWS S3** with **CloudFront** for optimized storage and global delivery.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone [https://github.com/MrShreyas/video-recording-app.git](https://github.com/MrShreyas/video-recording-app.git)
cd video-recording-app
2. Install FFmpeg
The application requires FFmpeg to handle video trimming and encoding.

Download the latest build from the FFmpeg official site.

Extract the files to a folder (e.g., C:\ffmpeg).

Add the bin folder path to your system's Environment Variables (Path):

Example: C:\ffmpeg\bin

☁️ AWS Configuration
S3 Bucket Setup
Create a new S3 bucket in your AWS Console.

In the Permissions tab, update the CORS configuration to allow uploads from your frontend:

JSON

[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "[https://your-domain-name.com](https://your-domain-name.com)"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
IAM User Policy
Create an IAM user for the application and attach the following inline policy. This grants the app permission to upload and retrieve videos.

JSON

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::your-s3-bucket-name/*"
        }
    ]
}
CloudFront & OAC
Create a CloudFront Distribution.

Select your S3 bucket as the Origin Domain.

Enable Origin Access Control (OAC) (Recommended).

After creation, AWS will provide a Bucket Policy. Copy this policy, go back to your S3 bucket permissions, and paste it into the Bucket Policy editor. This ensures your bucket remains private while CloudFront handles the delivery.

🛠️ Environment Setup
Create a .env file in the root directory and fill in the following details:

Code snippet

# AWS Private Credentials
AWS_REGION=your-region
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Database
MONGODB_URI=your-mongodb-connection-string

# Public Variables (Client-Side)
NEXT_PUBLIC_S3_BUCKET=your-bucket-name
NEXT_PUBLIC_AWS_REGION=your-region
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=your-id.cloudfront.net
NEXT_PUBLIC_APP_DOMAIN=http://localhost:3000
🏃 Running the Application
Local Development
Ensure you have pnpm installed:

Bash

pnpm i
pnpm run dev
Production with Docker
To build and deploy using Docker, run the following commands (replace placeholders with your actual values):

Bash

# Build the image
docker build \
  --build-arg NEXT_PUBLIC_APP_DOMAIN=your-domain.com \
  --build-arg NEXT_PUBLIC_CLOUDFRONT_DOMAIN=your-id.cloudfront.net \
  -t video-recording-app .

# Start the container
docker compose up -d --build
📝 Notes
Ensure your NEXT_PUBLIC_APP_DOMAIN matches the origin set in your S3 CORS policy.

For production, always use HTTPS for your domain to ensure the MediaRecorder API works correctly.

Thanks! Hope this helps you get started.
