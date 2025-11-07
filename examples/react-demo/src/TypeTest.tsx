/**
 * Type Safety Test
 * This file tests that all design tokens are properly type-checked
 */

import { Box, Text, styled } from './zen.config'

export function TypeTest() {
  return (
    <Box>
      {/* ✅ Valid color tokens - should work */}
      <Text color="brand.500" mb={4}>
        Valid: brand.500
      </Text>
      <Text color="gray.900" mb={4}>
        Valid: gray.900
      </Text>
      <Text color="red.600" mb={4}>
        Valid: red.600
      </Text>
      <Text color="green.500" mb={4}>
        Valid: green.500
      </Text>
      <Text color="white" mb={4}>
        Valid: white
      </Text>
      <Text color="black" mb={4}>
        Valid: black
      </Text>

      {/* ✅ Valid spacing tokens - should work */}
      <Box p={4} m={8} gap={6}>
        Valid spacing tokens
      </Box>

      {/* ✅ Valid font size tokens - should work */}
      <Text fontSize="xs">xs</Text>
      <Text fontSize="sm">sm</Text>
      <Text fontSize="base">base</Text>
      <Text fontSize="lg">lg</Text>
      <Text fontSize="xl">xl</Text>
      <Text fontSize="2xl">2xl</Text>
      <Text fontSize="3xl">3xl</Text>
      <Text fontSize="4xl">4xl</Text>
      <Text fontSize="5xl">5xl</Text>

      {/* ✅ Valid font weight tokens - should work */}
      <Text fontWeight="normal">normal</Text>
      <Text fontWeight="medium">medium</Text>
      <Text fontWeight="semibold">semibold</Text>
      <Text fontWeight="bold">bold</Text>
      <Text fontWeight="extrabold">extrabold</Text>

      {/* ✅ Valid pseudo-selectors - should work */}
      <Box
        p={4}
        bg="brand.500"
        _hover={{ bg: 'brand.600' }}
        _focus={{ bg: 'brand.700' }}
        _active={{ bg: 'brand.800' }}
      >
        Pseudo selectors
      </Box>

      {/* ❌ UNCOMMENT TO TEST TYPE ERRORS */}
      {/* <Text color="invalid.500">Should fail</Text> */}
      {/* <Text fontSize="huge">Should fail</Text> */}
      {/* <Box p="invalid">Should fail</Box> */}
      {/* <Text fontWeight="invalid">Should fail</Text> */}
    </Box>
  )
}

// Test styled components
const TestButton = styled('button', {
  bg: 'brand.500', // Should autocomplete: brand.50, brand.100, ..., brand.900
  color: 'white', // Should autocomplete: white, black, brand.*, gray.*, red.*, green.*
  px: 6, // Should autocomplete: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32
  py: 3, // Should autocomplete
  fontSize: 'base', // Should autocomplete: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
  fontWeight: 'semibold', // Should autocomplete: normal, medium, semibold, bold, extrabold
  rounded: 'md', // Should autocomplete: sm, base, md, lg, xl, 2xl, full
  _hover: {
    bg: 'brand.600', // Should autocomplete nested
  },
})

export { TestButton }
