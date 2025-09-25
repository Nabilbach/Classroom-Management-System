#!/usr/bin/env bash
# Environment Safety Check Script

echo "🔒 Environment Safety Check"
echo "Current directory: $(pwd)"

if [[ "$PWD" == *"Development"* ]]; then
    echo "✅ You are in DEVELOPMENT environment 🧪"
    echo "Safe to proceed with development work"
else
    echo "🚨 WARNING: You are in PRODUCTION environment 🏭"
    echo "❌ DO NOT modify files without explicit permission!"
    echo ""
    read -p "Do you have explicit permission to modify PRODUCTION? (yes/no): " permission
    if [ "$permission" != "yes" ]; then
        echo "❌ Operation cancelled for safety"
        exit 1
    fi
fi