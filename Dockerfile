# -----------------------
# Build stage
# -----------------------
FROM golang:1.25-alpine AS builder

# Set working directory
WORKDIR /app

# Copy Go modules manifests
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the source code
COPY server/ ./server/

# Build the Go binary
RUN go build -o /server ./server/main.go

# -----------------------
# Final stage
# -----------------------
FROM alpine:latest

# Install CA certs for HTTPS if needed
RUN apk add --no-cache ca-certificates

# Set working directory
WORKDIR /app

# Copy built binary from builder
COPY --from=builder /server /server

# Copy static site content
COPY public/ ./public/

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Run the Go server
CMD ["/server"]