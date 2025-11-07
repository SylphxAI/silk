/**
 * Test file for simplified createZenReact API
 * Verify that type inference still works perfectly
 */

import { Box, Text, styled } from './zen.config'

export function TestSimplifiedAPI() {
  return (
    <Box p={6} bg="brand.100" rounded="lg">
      <Text fontSize="2xl" fontWeight="bold" color="gray.900" mb={4}>
        Simplified API Test
      </Text>

      {/* Test 1: Box component with color tokens */}
      <Box
        bg="brand.500" // Should have full color token autocomplete
        color="white"
        p={4}
        rounded="md"
        mb={4}
      >
        <Text fontSize="base">
          Hover over 'bg' prop - should show full union type
        </Text>
      </Box>

      {/* Test 2: Text component with typography tokens */}
      <Text
        color="gray.700" // Should have full color token autocomplete
        fontSize="lg" // Should have full fontSize token autocomplete
        fontWeight="semibold" // Should have full fontWeight token autocomplete
        mb={4}
      >
        All props should have full type inference
      </Text>

      {/* Test 3: styled components */}
      <StyledButton bg="brand.600">Styled Button</StyledButton>

      {/* Test 4: Pseudo selectors */}
      <Box
        p={4}
        bg="gray.100"
        rounded="md"
        _hover={{
          bg: 'gray.200', // Should have full color token autocomplete
        }}
        _focus={{
          bg: 'gray.300',
        }}
      >
        Interactive Box - Hover to see effect
      </Box>
    </Box>
  )
}

// Test styled component creation
const StyledButton = styled('button', {
  px: 6,
  py: 3,
  bg: 'brand.500', // Should have full autocomplete
  color: 'white',
  rounded: 'md',
  fontWeight: 'semibold',
  _hover: {
    bg: 'brand.600', // Should have full autocomplete
  },
})

/**
 * Expected behavior:
 *
 * 1. Box props in JSX:
 *    bg?: "white" | "black" | "brand.50" | ... | (string & {})
 *
 * 2. Text props in JSX:
 *    color?: "white" | "black" | "brand.50" | ... | (string & {})
 *    fontSize?: "xs" | "sm" | "base" | "lg" | ... | (string & {})
 *
 * 3. styled() baseStyles:
 *    bg: "white" | "black" | "brand.50" | ... | (string & {})
 *
 * 4. Autocomplete should work for all props
 *
 * 5. Invalid tokens should produce TypeScript errors
 */
