import { useState } from 'react'
import { Box, Flex, Text, styled } from './zen.config'

// Create styled components with type inference
const Container = styled('div', {
  w: 'full',
  h: 'screen',
  bg: 'gray.50',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
})

const Card = styled('div', {
  bg: 'white',
  p: 8,
  rounded: 'xl',
  shadow: 'lg',
  w: 'lg',
})

const Button = styled('button', {
  bg: 'brand.500',
  color: 'white',
  px: 6,
  py: 3,
  rounded: 'md',
  fontWeight: 'semibold',
  fontSize: 'base',
  _hover: {
    bg: 'brand.600',
  },
})

const Badge = styled('span', {
  px: 3,
  py: 1,
  rounded: 'full',
  fontSize: 'sm',
  fontWeight: 'medium',
})

function App() {
  const [count, setCount] = useState(0)

  return (
    <Container>
      {/* Hero Section */}
      <Box mb={8}>
        <Text fontSize="4xl" fontWeight="bold" color="gray.900" mb={2}>
          ZenCSS
        </Text>
        <Text fontSize="xl" color="gray.600">
          Type-safe CSS without codegen
        </Text>
      </Box>

      {/* Feature Cards */}
      <Flex gap={4} mb={8}>
        <Card>
          <Badge bg="brand.100" color="brand.700">
            🚀 Fast
          </Badge>
          <Text fontSize="lg" fontWeight="semibold" mt={4} mb={2}>
            Build-time Extraction
          </Text>
          <Text color="gray.600">
            Zero runtime overhead. CSS is extracted at build time for maximum performance.
          </Text>
        </Card>

        <Card>
          <Badge bg="green.100" color="green.700">
            ✨ Type-safe
          </Badge>
          <Text fontSize="lg" fontWeight="semibold" mt={4} mb={2}>
            Full Type Inference
          </Text>
          <Text color="gray.600">
            Autocomplete for all design tokens. No codegen needed - pure TypeScript magic.
          </Text>
        </Card>

        <Card>
          <Badge bg="red.100" color="red.700">
            🎨 Flexible
          </Badge>
          <Text fontSize="lg" fontWeight="semibold" mt={4} mb={2}>
            Framework Agnostic
          </Text>
          <Text color="gray.600">
            Works with React, Vue, Solid, or vanilla JS. Use any framework you prefer.
          </Text>
        </Card>
      </Flex>

      {/* Interactive Demo */}
      <Card>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>
          Interactive Demo
        </Text>

        <Flex gap={4} alignItems="center">
          <Button onClick={() => setCount(count + 1)}>
            Count: {count}
          </Button>

          <Button
            bg="gray.200"
            color="gray.800"
            _hover={{ bg: 'gray.300' }}
            onClick={() => setCount(0)}
          >
            Reset
          </Button>
        </Flex>

        <Box mt={6} p={4} bg="gray.100" rounded="md">
          <Text fontSize="sm" color="gray.600" mb={2}>
            Try hovering the buttons to see pseudo-state styling in action!
          </Text>
          <Text fontSize="xs" color="gray.500">
            All styles are type-checked at compile time with full autocomplete.
          </Text>
        </Box>
      </Card>

      {/* Code Example */}
      <Card>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Example Code
        </Text>

        <Box
          as="pre"
          p={4}
          bg="gray.900"
          color="white"
          rounded="md"
          fontSize="sm"
          style={{ overflow: 'auto' }}
        >
          {`const Button = styled('button', {
  bg: 'brand.500',  // ✨ Fully typed!
  color: 'white',
  px: 6,
  py: 3,
  rounded: 'md',
  _hover: {
    bg: 'brand.600'
  }
})`}
        </Box>
      </Card>

      {/* Footer */}
      <Text fontSize="sm" color="gray.500" mt={8}>
        Built with ZenCSS • No codegen, just types
      </Text>
    </Container>
  )
}

export default App
