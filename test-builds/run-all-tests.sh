#!/bin/bash

# Silk Framework Build Tests
# Systematic testing for all supported frameworks
# Must pass before each release

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Silk Framework Build Tests                    ║${NC}"
echo -e "${BLUE}║  Systematic testing for all supported frameworks      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

FAILED=0
PASSED=0
SKIPPED=0
START_TIME=$(date +%s)

# Helper function to test a framework
test_framework() {
  local TEST_NUM=$1
  local TEST_NAME=$2
  local TEST_DIR=$3
  local BUILD_CMD=${4:-"npm run build"}
  local VERIFY_CMD=$5

  echo -e "${YELLOW}📦 Test ${TEST_NUM}: ${TEST_NAME}${NC}"

  if [ ! -d "$TEST_DIR" ]; then
    echo -e "${BLUE}  ℹ️  Skipped (directory not found)${NC}"
    SKIPPED=$((SKIPPED+1))
    echo ""
    return
  fi

  cd "$TEST_DIR"

  # Clean
  rm -rf dist .next node_modules/.cache 2>/dev/null || true

  # Install if needed
  if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}  📥 Installing dependencies...${NC}"
    npm install --silent > /tmp/${TEST_DIR//\//_}-install.log 2>&1 || {
      echo -e "${RED}  ❌ Install failed${NC}"
      cat /tmp/${TEST_DIR//\//_}-install.log
      FAILED=$((FAILED+1))
      cd - > /dev/null
      echo ""
      return
    }
  fi

  # Build
  echo -e "${CYAN}  🔨 Building...${NC}"
  if eval "$BUILD_CMD" > /tmp/${TEST_DIR//\//_}-build.log 2>&1; then
    # Verify
    if eval "$VERIFY_CMD"; then
      echo -e "${GREEN}  ✅ Build passed${NC}"
      PASSED=$((PASSED+1))
    else
      echo -e "${RED}  ❌ Verification failed${NC}"
      cat /tmp/${TEST_DIR//\//_}-build.log | tail -50
      FAILED=$((FAILED+1))
    fi
  else
    echo -e "${RED}  ❌ Build failed${NC}"
    cat /tmp/${TEST_DIR//\//_}-build.log | tail -50
    FAILED=$((FAILED+1))
  fi

  cd - > /dev/null
  echo ""
}

# Test 1: Vite + React (No-codegen)
test_framework 1 "Vite + React (No-codegen)" "vite-app" "npm run build" '
  CSS_FILE=$(ls dist/assets/*.css 2>/dev/null | head -1)
  if [ -n "$CSS_FILE" ]; then
    CSS_SIZE=$(wc -c < "$CSS_FILE" | tr -d " ")
    echo -e "${GREEN}  ✅ CSS generated: $(basename "$CSS_FILE") (${CSS_SIZE} bytes)${NC}"
    echo -e "${GREEN}  ✅ Virtual module → Vite CSS pipeline${NC}"
    return 0
  else
    echo -e "${RED}  ❌ CSS not found in dist/assets/${NC}"
    return 1
  fi
'

# Test 2: Webpack (No-codegen)
test_framework 2 "Webpack (No-codegen)" "webpack-app" "npm run build" '
  CSS_FILE=$(ls dist/*.css 2>/dev/null | head -1)
  if [ -n "$CSS_FILE" ]; then
    CSS_SIZE=$(wc -c < "$CSS_FILE" | tr -d " ")
    echo -e "${GREEN}  ✅ CSS generated: $(basename "$CSS_FILE") (${CSS_SIZE} bytes)${NC}"
    echo -e "${GREEN}  ✅ Virtual module → webpack CSS pipeline${NC}"
    return 0
  else
    echo -e "${RED}  ❌ CSS not found in dist/${NC}"
    return 1
  fi
'

# Test 3: Next.js + Webpack (No-codegen)
test_framework 3 "Next.js + Webpack (No-codegen)" "nextjs-webpack-app" "npm run build" '
  CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
  if [ -n "$CSS_FILE" ]; then
    CSS_SIZE=$(wc -c < "$CSS_FILE" | tr -d " ")
    echo -e "${GREEN}  ✅ CSS generated: $(basename "$CSS_FILE") (${CSS_SIZE} bytes)${NC}"
    echo -e "${GREEN}  ✅ Virtual module → Next.js CSS pipeline${NC}"

    # Check static pages generated
    PAGE_COUNT=$(find .next/server/app -name "*.html" 2>/dev/null | wc -l | tr -d " ")
    echo -e "${GREEN}  ✅ Static pages generated: ${PAGE_COUNT}${NC}"
    return 0
  else
    echo -e "${RED}  ❌ CSS not found in .next/static/css/${NC}"
    return 1
  fi
'

# Test 4: Next.js + Turbopack + CLI (Semi-codegen)
test_framework 4 "Next.js + Turbopack + CLI (Semi-codegen)" "nextjs-turbopack-app" "npm run build" '
  # Check generated CSS exists
  if [ -f "src/silk.generated.css" ]; then
    GEN_SIZE=$(wc -c < "src/silk.generated.css" | tr -d " ")
    echo -e "${GREEN}  ✅ silk.generated.css created (${GEN_SIZE} bytes)${NC}"

    # Check CSS in build output
    CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
    if [ -n "$CSS_FILE" ]; then
      CSS_SIZE=$(wc -c < "$CSS_FILE" | tr -d " ")
      echo -e "${GREEN}  ✅ CSS in build: $(basename "$CSS_FILE") (${CSS_SIZE} bytes)${NC}"
      echo -e "${GREEN}  ✅ CLI → Physical file → Next.js CSS pipeline${NC}"
      return 0
    else
      echo -e "${RED}  ❌ CSS not found in .next/static/css/${NC}"
      return 1
    fi
  else
    echo -e "${RED}  ❌ silk.generated.css not found${NC}"
    return 1
  fi
'

# Test 5: Vue 3 + Vite (No-codegen)
test_framework 5 "Vue 3 + Vite (No-codegen)" "vue-vite-app" "npm run build" '
  CSS_FILE=$(ls dist/assets/*.css 2>/dev/null | head -1)
  if [ -n "$CSS_FILE" ]; then
    CSS_SIZE=$(wc -c < "$CSS_FILE" | tr -d " ")
    echo -e "${GREEN}  ✅ CSS generated: $(basename "$CSS_FILE") (${CSS_SIZE} bytes)${NC}"
    echo -e "${GREEN}  ✅ Virtual module → Vite CSS pipeline${NC}"
    return 0
  else
    echo -e "${RED}  ❌ CSS not found in dist/assets/${NC}"
    return 1
  fi
'

# Test 6: Nuxt 3 (No-codegen)
test_framework 6 "Nuxt 3 (No-codegen)" "nuxt-app" "npm run build" '
  CSS_FILE=$(find .output/public/_nuxt -name "*.css" 2>/dev/null | head -1)
  if [ -n "$CSS_FILE" ]; then
    CSS_SIZE=$(wc -c < "$CSS_FILE" | tr -d " ")
    echo -e "${GREEN}  ✅ CSS generated: $(basename "$CSS_FILE") (${CSS_SIZE} bytes)${NC}"
    echo -e "${GREEN}  ✅ Auto-import → Nuxt CSS pipeline${NC}"
    return 0
  else
    echo -e "${RED}  ❌ CSS not found in .output/public/_nuxt/${NC}"
    return 1
  fi
'

# Test 7: Svelte + Vite (No-codegen)
test_framework 7 "Svelte + Vite (No-codegen)" "svelte-vite-app" "npm run build" '
  CSS_FILE=$(ls dist/assets/*.css 2>/dev/null | head -1)
  if [ -n "$CSS_FILE" ]; then
    CSS_SIZE=$(wc -c < "$CSS_FILE" | tr -d " ")
    echo -e "${GREEN}  ✅ CSS generated: $(basename "$CSS_FILE") (${CSS_SIZE} bytes)${NC}"
    echo -e "${GREEN}  ✅ Virtual module → Vite CSS pipeline${NC}"
    return 0
  else
    echo -e "${RED}  ❌ CSS not found in dist/assets/${NC}"
    return 1
  fi
'

# Test 8: SvelteKit (No-codegen)
test_framework 8 "SvelteKit (No-codegen)" "sveltekit-app" "npm run build" '
  CSS_FILE=$(find .svelte-kit/output/client/_app/immutable/assets -name "*.css" 2>/dev/null | head -1)
  if [ -n "$CSS_FILE" ]; then
    CSS_SIZE=$(wc -c < "$CSS_FILE" | tr -d " ")
    echo -e "${GREEN}  ✅ CSS generated: $(basename "$CSS_FILE") (${CSS_SIZE} bytes)${NC}"
    echo -e "${GREEN}  ✅ Virtual module → SvelteKit CSS pipeline${NC}"
    return 0
  else
    echo -e "${RED}  ❌ CSS not found in .svelte-kit/output/${NC}"
    return 1
  fi
'

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Test Summary                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Total Tests:  $((PASSED + FAILED + SKIPPED))"
echo -e "  Passed:       ${GREEN}${PASSED}${NC}"
echo -e "  Failed:       ${RED}${FAILED}${NC}"
echo -e "  Skipped:      ${BLUE}${SKIPPED}${NC}"
echo -e "  Duration:     ${DURATION}s"
echo ""

if [ $FAILED -eq 0 ] && [ $PASSED -gt 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ All tests passed! Ready for release.              ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
  exit 0
elif [ $PASSED -eq 0 ] && [ $SKIPPED -gt 0 ]; then
  echo -e "${YELLOW}⚠️  No tests ran (all skipped). Create test apps first.${NC}"
  exit 1
else
  echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ Some tests failed. Fix before release.            ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
