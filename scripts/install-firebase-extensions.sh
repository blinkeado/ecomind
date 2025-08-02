#!/bin/bash

# WORLD-CLASS DATABASE ARCHITECTURE - Firebase Extensions Installation Script
# SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Firebase Extensions Integration
# VERSION: 2.0 - Automated installation of production-ready AI extensions
# STATUS: ✅ Production Ready Extensions Only

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="ecomind-app"
EXTENSIONS_DIR="./extensions"

echo -e "${BLUE}🚀 Installing Firebase Extensions for EcoMind World-Class Architecture${NC}"
echo -e "${BLUE}================================================================${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed. Please install it first:${NC}"
    echo -e "${YELLOW}npm install -g firebase-tools${NC}"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Firebase. Please login first:${NC}"
    echo -e "${YELLOW}firebase login${NC}"
    exit 1
fi

# Set Firebase project
echo -e "${BLUE}📋 Setting Firebase project to: ${PROJECT_ID}${NC}"
firebase use ${PROJECT_ID}

echo ""
echo -e "${GREEN}✅ Installing Production-Ready Firebase Extensions${NC}"
echo -e "${GREEN}=================================================${NC}"

# Extension 1: Gemini Chatbot Extension
echo -e "${BLUE}🤖 Installing: Build Chatbot with the Gemini API${NC}"
echo -e "${YELLOW}   Status: ✅ GA (General Availability)${NC}"
echo -e "${YELLOW}   Version: 0.2.5${NC}"
echo -e "${YELLOW}   Purpose: AI-powered relationship guidance and memory assistance${NC}"

if [ -f "${EXTENSIONS_DIR}/gemini-chatbot.env" ]; then
    firebase ext:install googlecloud/firestore-genai-chatbot \
        --local \
        --params="${EXTENSIONS_DIR}/gemini-chatbot.env" \
        --force
    echo -e "${GREEN}   ✅ Gemini Chatbot extension installed successfully${NC}"
else
    echo -e "${RED}   ❌ Configuration file not found: ${EXTENSIONS_DIR}/gemini-chatbot.env${NC}"
    exit 1
fi

echo ""

# Extension 2: Multimodal Tasks Extension
echo -e "${BLUE}📸 Installing: Multimodal Tasks with the Gemini API${NC}"
echo -e "${YELLOW}   Status: ✅ GA (General Availability)${NC}"
echo -e "${YELLOW}   Version: 0.1.8${NC}"
echo -e "${YELLOW}   Purpose: Analyze photos, videos, and voice notes for relationship context${NC}"

if [ -f "${EXTENSIONS_DIR}/multimodal-tasks.env" ]; then
    firebase ext:install googlecloud/firestore-multimodal-genai \
        --local \
        --params="${EXTENSIONS_DIR}/multimodal-tasks.env" \
        --force
    echo -e "${GREEN}   ✅ Multimodal Tasks extension installed successfully${NC}"
else
    echo -e "${RED}   ❌ Configuration file not found: ${EXTENSIONS_DIR}/multimodal-tasks.env${NC}"
    exit 1
fi

echo ""

# Extension 3: Translation Extension (Optional - for international users)
echo -e "${BLUE}🌍 Installing: Translate Text in Firestore${NC}"
echo -e "${YELLOW}   Status: ✅ GA (General Availability)${NC}"
echo -e "${YELLOW}   Purpose: Translate relationship notes for international users${NC}"

firebase ext:install firebase/firestore-translate-text \
    --params="LANGUAGES=en,es,fr,de,it,pt,zh,ja,ko,ar" \
    --params="INPUT_FIELD_NAME=originalText" \
    --params="OUTPUT_FIELD_NAME=translations" \
    --params="COLLECTION_PATH=users/{uid}/relationships/{relationshipId}/interactions" \
    --force

echo -e "${GREEN}   ✅ Translation extension installed successfully${NC}"

echo ""

# Extension 4: Backup Extension (Data Protection)
echo -e "${BLUE}💾 Installing: Backup Firestore to Cloud Storage${NC}"
echo -e "${YELLOW}   Status: ✅ GA (General Availability)${NC}"
echo -e "${YELLOW}   Purpose: Automated backups for data protection${NC}"

firebase ext:install firebase/firestore-backup-restore \
    --params="BACKUP_SCHEDULE=0 2 * * *" \
    --params="BACKUP_RETENTION_DAYS=30" \
    --params="COLLECTION_PATHS=users" \
    --params="STORAGE_BUCKET=${PROJECT_ID}.appspot.com" \
    --force

echo -e "${GREEN}   ✅ Backup extension installed successfully${NC}"

echo ""

# Extension 5: Search Extension (Enhanced Discovery)
echo -e "${BLUE}🔍 Installing: Search with Algolia${NC}"
echo -e "${YELLOW}   Status: ✅ GA (General Availability)${NC}"
echo -e "${YELLOW}   Purpose: Enhanced search capabilities for relationships and memories${NC}"

# Note: This requires Algolia configuration
echo -e "${YELLOW}   ⚠️  Algolia configuration required - skipping for now${NC}"
echo -e "${YELLOW}   💡 To enable: Configure Algolia account and run extension installation${NC}"

echo ""

# Verify installations
echo -e "${BLUE}🔍 Verifying Extension Installations${NC}"
echo -e "${BLUE}====================================${NC}"

firebase ext:list

echo ""
echo -e "${GREEN}🎉 Firebase Extensions Installation Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"

echo ""
echo -e "${BLUE}📊 Installed Extensions Summary:${NC}"
echo -e "${GREEN}✅ Gemini Chatbot${NC} - AI-powered relationship guidance"
echo -e "${GREEN}✅ Multimodal Tasks${NC} - Photo/video/audio analysis"
echo -e "${GREEN}✅ Text Translation${NC} - International support"
echo -e "${GREEN}✅ Firestore Backup${NC} - Data protection"

echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "1. Configure Vertex AI API credentials in Firebase Console"
echo "2. Set up billing for Gemini API usage"
echo "3. Test extensions with sample data"
echo "4. Monitor usage and costs in Firebase Console"
echo "5. Configure additional security rules if needed"

echo ""
echo -e "${BLUE}📚 Useful Commands:${NC}"
echo -e "${YELLOW}firebase ext:list${NC}                    # List installed extensions"
echo -e "${YELLOW}firebase ext:info <extension-name>${NC}    # Get extension details"
echo -e "${YELLOW}firebase ext:configure <extension-name>${NC} # Reconfigure extension"
echo -e "${YELLOW}firebase ext:uninstall <extension-name>${NC} # Remove extension"

echo ""
echo -e "${BLUE}🔗 Documentation Links:${NC}"
echo "• Firebase Extensions Hub: https://extensions.dev/"
echo "• Gemini API Documentation: https://ai.google.dev/docs"
echo "• Vertex AI Pricing: https://cloud.google.com/vertex-ai/pricing"
echo "• Firebase Console: https://console.firebase.google.com/"

echo ""
echo -e "${BLUE}⚠️  Important Reminders:${NC}"
echo "• Extensions process data in the cloud - ensure GDPR compliance"
echo "• Monitor API usage and costs regularly"
echo "• Test all functionality before production deployment"
echo "• Keep extension configurations in version control"

echo ""
echo -e "${GREEN}🚀 World-Class Database Architecture Extensions Ready!${NC}"