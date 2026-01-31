#!/bin/bash

# Setup script for pre-commit hooks
# This script ensures that pre-commit is installed and the hooks are set up.

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    print_warning "pre-commit not found. Attempting to install..."

    # Try installing via brew (preferred on macOS)
    if command -v brew &> /dev/null; then
        print_status "Installing pre-commit via Homebrew..."
        brew install pre-commit
    # Try installing via pipx
    elif command -v pipx &> /dev/null; then
        print_status "Installing pre-commit via pipx..."
        pipx install pre-commit
    # Try installing via pip with --user if it's not a managed environment (or just fail and guide the user)
    elif command -v pip &> /dev/null || command -v pip3 &> /dev/null; then
        PIP_CMD=$(command -v pip3 || command -v pip)
        print_warning "Attempting install via $PIP_CMD --user (this may fail in managed environments)..."
        $PIP_CMD install --user pre-commit || {
            print_error "Failed to install pre-commit via pip."
            print_error "Your Python environment seems to be externally managed (PEP 668)."
            print_error "Please install pre-commit using one of these methods:"
            print_error "  1. brew install pre-commit"
            print_error "  2. pipx install pre-commit"
            print_error "  3. Use a virtual environment"
            exit 1
        }
    else
        print_error "Could not find brew, pipx, or pip to install pre-commit."
        print_error "Please install pre-commit manually: https://pre-commit.com/#install"
        exit 1
    fi
fi

print_status "pre-commit is installed: $(pre-commit --version)"

# Install hooks
print_status "Installing pre-commit hooks..."
pre-commit install

# Install ruff if not present (optional, since pre-commit manages it, but good for local dev)
if ! command -v ruff &> /dev/null; then
    print_warning "ruff not found. You might want to install it for local development: pip install ruff"
fi

print_status "Pre-commit hooks setup complete!"
print_status "You can manually run them on all files with: pre-commit run --all-files"
