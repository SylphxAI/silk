#!/bin/bash

# Integration tests for Silk
# Tests all build configurations

set -e  # Exit on error

echo "🧪 Silk Integration Tests"
echo "=========================="
echo ""

# Colors
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Rebuild packages first (required for file: dependencies)
echo -e "${YELLOW}🔨 Building packages...${NC}"
cd ../packages/core
bun run build > /dev/null 2>&1
cd ../nextjs-plugin
bun run build > /dev/null 2>&1
echo -e "${GREEN}✅ Packages built${NC}"
echo ""

# Test 1: Unit tests
echo -e "${YELLOW}📦 Test 1: Unit Tests${NC}"
cd ../../packages/core
if bun run test; then
  echo -e "${GREEN}✅ Unit tests passed${NC}"
else
  echo -e "${RED}❌ Unit tests failed${NC}"
  FAILED=$((FAILED+1))
fi
echo ""

# Test 2: Webpack build
echo -e "${YELLOW}📦 Test 2: Next.js Webpack Build${NC}"
cd ../../test-integration/nextjs-webpack
rm -rf .next node_modules
npm install --silent --legacy-peer-deps
if npm run build > /dev/null 2>&1; then
  if [ -f ".next/static/css/silk.css" ]; then
    CSS_SIZE=$(wc -c < .next/static/css/silk.css | tr -d ' ')
    echo -e "${GREEN}✅ Webpack build passed (CSS: ${CSS_SIZE} bytes)${NC}"
  else
    echo -e "${RED}❌ Webpack build failed: CSS not generated${NC}"
    FAILED=$((FAILED+1))
  fi
else
  echo -e "${RED}❌ Webpack build failed${NC}"
  FAILED=$((FAILED+1))
fi
echo ""

# Test 3: Turbopack dev mode
echo -e "${YELLOW}📦 Test 3: Next.js Turbopack Dev Mode${NC}"
cd ../nextjs-turbopack
rm -rf .next node_modules
npm install --silent --legacy-peer-deps
# Start server in background
npm run dev > /tmp/turbopack-test.log 2>&1 &
DEV_PID=$!
sleep 10

# Check if server is running and no errors
if ps -p $DEV_PID > /dev/null; then
  if ! grep -q "lightningcss.*node" /tmp/turbopack-test.log && \
     ! grep -q "Module not found.*lightningcss" /tmp/turbopack-test.log; then
    echo -e "${GREEN}✅ Turbopack dev mode passed (no lightningcss errors)${NC}"
  else
    echo -e "${RED}❌ Turbopack dev mode failed: lightningcss errors found${NC}"
    cat /tmp/turbopack-test.log
    FAILED=$((FAILED+1))
  fi
  kill $DEV_PID
else
  echo -e "${RED}❌ Turbopack dev mode failed: server crashed${NC}"
  cat /tmp/turbopack-test.log
  FAILED=$((FAILED+1))
fi
echo ""

# Summary
echo "=========================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ ${FAILED} test(s) failed${NC}"
  exit 1
fi
