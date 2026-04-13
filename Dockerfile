# ============================================
# TextForge — Multi-Stage Docker Build
# Stage 1: Compile C++ Engine
# Stage 2: Node.js Runtime
# ============================================

# Stage 1: Build C++ engine
FROM gcc:11-bullseye AS builder
WORKDIR /build
COPY main.cpp rabin_karp.cpp rabin_karp.h naive.cpp naive.h file_handler.cpp file_handler.h utils.cpp utils.h Makefile ./
RUN make

# Stage 2: Production runtime
FROM node:18-slim
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production && npm cache clean --force

# Copy application files
COPY server.js ./
COPY public/ public/
COPY sample1.txt sample2.txt ./

# Copy compiled C++ binary from builder
COPY --from=builder /build/text_analysis ./text_analysis
RUN chmod +x ./text_analysis

# Create uploads directory
RUN mkdir -p uploads

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

# Run as non-root user
RUN groupadd -r textforge && useradd -r -g textforge textforge && \
    chown -R textforge:textforge /app
USER textforge

CMD ["node", "server.js"]
