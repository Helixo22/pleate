import { HStack, Stack, VStack } from "pleate/stack";

const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="grid h-12 min-w-16 place-items-center rounded-lg bg-accent-soft px-4 text-subhead font-semibold text-accent-ink">{children}</div>
);

export default function Demo() {
  return (
    <VStack gap={8} className="w-full">
      <HStack gap={2}>
        <Box>1</Box>
        <Box>2</Box>
        <Box>3</Box>
      </HStack>
      <VStack gap={2} className="max-w-xs">
        <Box>A</Box>
        <Box>B</Box>
      </VStack>
      <Stack direction="responsive" gap={3} justify="between">
        <Box>Stacks on phones</Box>
        <Box>Lines up from md</Box>
      </Stack>
    </VStack>
  );
}
