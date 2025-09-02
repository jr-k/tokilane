#!/bin/bash
set -e

# Function to ensure directory exists with correct permissions
ensure_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        echo "Creating directory: $dir"
        mkdir -p "$dir"
    fi
    
    # Always ensure correct ownership, even if directory already exists
    echo "Setting ownership for: $dir"
    chown -R appuser:appgroup "$dir" 2>/dev/null || {
        echo "Warning: Could not change ownership of $dir (this is normal if running as non-root)"
        echo "Make sure the host directory has appropriate permissions for UID 1001"
    }
}

# If running as root, set up directories and switch to appuser
if [ "$(id -u)" = "0" ]; then
    echo "Running as root, setting up directories..."
    
    # Ensure required directories exist with correct permissions
    ensure_directory "/app/data"
    ensure_directory "/app/data/thumbs" 
    ensure_directory "/app/files"
    
    echo "Switching to appuser and executing: $@"
    exec gosu appuser "$@"
else
    echo "Running as non-root user ($(id -u))"
    
    # Try to create directories if they don't exist
    # This will work if the mounted volumes have appropriate permissions
    mkdir -p /app/data/thumbs 2>/dev/null || echo "Could not create /app/data/thumbs (check host directory permissions)"
    mkdir -p /app/files 2>/dev/null || echo "Could not create /app/files (check host directory permissions)"
    
    echo "Executing: $@"
    exec "$@"
fi
