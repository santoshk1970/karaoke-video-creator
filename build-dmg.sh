#!/bin/bash

# Exit on error
set -e

# --- Configuration ---
APP_NAME="Lyric Sync UI"
VERSION=$(node -p "require('./web-ui/package.json').version")
BUILD_DIR="build"
DMG_NAME="${APP_NAME}-v${VERSION}.dmg"
TEMP_DIR="${BUILD_DIR}/dmg-staging"
EXECUTABLE_NAME="Lyric-Sync-UI-arm64"

# --- Build Steps ---

echo "Packaging ${APP_NAME} v${VERSION} for macOS..."

# 1. Clean up previous builds
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# 2. Build the standalone executable using pkg
(cd web-ui && npm run build)

# 3. Check if the executable was created
if [ ! -f "${BUILD_DIR}/${EXECUTABLE_NAME}" ]; then
    echo "Build failed: Executable not found!"
    exit 1
fi

# 4. Create a temporary directory for the DMG contents
echo "Creating DMG staging directory..."
mkdir -p "${TEMP_DIR}/${APP_NAME}.app/Contents/MacOS"

# 5. Copy the executable and create an Info.plist
cp "${BUILD_DIR}/${EXECUTABLE_NAME}" "${TEMP_DIR}/${APP_NAME}.app/Contents/MacOS/"

cat > "${TEMP_DIR}/${APP_NAME}.app/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${EXECUTABLE_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.santoshk.lyricsync</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
</dict>
</plist>
EOF

# 6. Create the DMG file
echo "Creating DMG file..."
hdiutil create -format UDZO -srcfolder "${TEMP_DIR}" "${BUILD_DIR}/${DMG_NAME}"

# 7. Clean up
echo "Cleaning up temporary files..."
rm -rf "${TEMP_DIR}"

echo "Successfully created ${BUILD_DIR}/${DMG_NAME}"
