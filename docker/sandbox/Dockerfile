FROM node:20-alpine

# Install Docker CLI for sandbox operations
RUN apk add --no-cache docker-cli

WORKDIR /workspace

# Create sandbox user
RUN addgroup -S sandbox && adduser -S sandbox -G sandbox

# Copy sandbox scripts
COPY run-sandbox.sh /usr/local/bin/run-sandbox.sh
RUN chmod +x /usr/local/bin/run-sandbox.sh

# Set up sandbox directory
RUN mkdir -p /workspace/projects && chown -R sandbox:sandbox /workspace

USER sandbox

CMD ["tail", "-f", "/dev/null"]
