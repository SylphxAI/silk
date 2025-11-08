#!/bin/bash

# Build tests for all frameworks
# Tests both no-codegen and semi-codegen approaches

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Silk Framework Build Tests           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

FAILED=0
PASSED=0

# Test 1: Vite (No-codegen)
echo -e "${YELLOW}📦 Test 1: Vite (No-codegen)${NC}"
cd vite-app
rm -rf dist node_modules package-lock.json
npm install --silent
if npm run build > /tmp/vite-build.log 2>&1; then
  CSS_FILE=$(ls dist/assets/*.css 2>/dev/null | head -1)
  if [ -n "$CSS_FILE" ]; then
    CSS_SIZE=$(wc -c < "$CSS_FILE" | tr -d ' ')
    echo -e "${GREEN}  ✅ Build passed${NC}"
    echo -e "${GREEN}  ✅ CSS generated: $(basename "$CSS_FILE") (${CSS_SIZE} bytes)${NC}"
    echo -e "${GREEN}  ✅ Virtual module → Vite CSS pipeline${NC}"
    PASSED=$((PASSED+1))
  else
    echo -e "${RED}  ❌ CSS not found in dist/assets/${NC}"
    ls -la dist/assets/ || echo "No assets directory"
    cat /tmp/vite-build.log
    FAILED=$((FAILED+1))
  fi
else
  echo -e "${RED}  ❌ Build failed${NC}"
  cat /tmp/vite-build.log
  FAILED=$((FAILED+1))
fi
cd ..
echo ""

# Test 2: Webpack (No-codegen) - TODO
echo -e "${YELLOW}📦 Test 2: Webpack (No-codegen)${NC}"
echo -e "${BLUE}  ℹ️  To be implemented${NC}"
echo ""

# Test 3: Next.js Webpack (No-codegen) - TODO
echo -e "${YELLOW}📦 Test 3: Next.js + Webpack (No-codegen)${NC}"
echo -e "${BLUE}  ℹ️  To be implemented${NC}"
echo ""

# Test 4: Next.js Turbopack + CLI (Semi-codegen) - TODO
echo -e "${YELLOW}📦 Test 4: Next.js + Turbopack + CLI (Semi-codegen)${NC}"
echo -e "${BLUE}  ℹ️  To be implemented${NC}"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Passed: ${GREEN}${PASSED}${NC}"
echo -e "  Failed: ${RED}${FAILED}${NC}"
echo -e "  Pending: ${BLUE}3${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All implemented tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
