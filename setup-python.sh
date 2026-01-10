#!/bin/bash

# Setup script for Python virtual environment

echo "🐍 Python Virtual Environment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip install -r requirements-python.txt

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "💡 To activate the virtual environment in future:"
echo "   source venv/bin/activate"
echo ""
echo "💡 To deactivate:"
echo "   deactivate"
echo ""
echo "📦 Installed packages:"
pip list | grep -E "demucs|basic-pitch"
