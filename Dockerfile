# Use the official Node.js Alpine image
FROM node:22-alpine

# ✅ Build-time args (MUST be after FROM)
ARG NEXT_PUBLIC_APP_DOMAIN
ARG NEXT_PUBLIC_CLOUDFRONT_DOMAIN

# ✅ Make them available to Next.js at build time
ENV NEXT_PUBLIC_APP_DOMAIN=${NEXT_PUBLIC_APP_DOMAIN}
ENV NEXT_PUBLIC_CLOUDFRONT_DOMAIN=${NEXT_PUBLIC_CLOUDFRONT_DOMAIN}

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Set the working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js (envs are now available ✅)
RUN pnpm run build

# Expose port
EXPOSE 3000

# Production mode
ENV NODE_ENV=production

# Start app
CMD ["pnpm", "start"]
