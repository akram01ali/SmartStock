import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useColorModeValue,
  Text,
  SegmentedControl,
  Flex,
  Box,
} from '@chakra-ui/react';

interface StockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentName: string;
  currentAmount: number;
  onSubmit: (amount: number, absolute: boolean, scannedBy: string) => Promise<void>;
  isLoading?: boolean;
}

export function StockUpdateModal({
  isOpen,
  onClose,
  componentName,
  currentAmount,
  onSubmit,
  isLoading = false,
}: StockUpdateModalProps) {
  const [amount, setAmount] = useState('');
  const [absolute, setAbsolute] = useState(false);
  const [scannedBy, setScannedBy] = useState('manual');
  const [error, setError] = useState<string | null>(null);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const inputBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setError(null);

      // Validate input
      if (!amount.trim()) {
        setError('Please enter an amount');
        return;
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        setError('Please enter a valid number');
        return;
      }

      // For relative updates, validate the operation won't go negative
      if (!absolute && numAmount < 0 && Math.abs(numAmount) > currentAmount) {
        setError(
          `Cannot subtract ${Math.abs(numAmount)} from current stock of ${currentAmount}`,
        );
        return;
      }

      // For absolute updates, validate non-negative
      if (absolute && numAmount < 0) {
        setError('Stock amount cannot be negative');
        return;
      }

      await onSubmit(numAmount, absolute, scannedBy);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    }
  };

  const handleClose = () => {
    setAmount('');
    setAbsolute(false);
    setScannedBy('manual');
    setError(null);
    onClose();
  };

  const calculatedAmount = absolute ? amount : `${parseFloat(amount) + currentAmount}`;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} color={textColor}>
        <ModalHeader>Update Stock: {componentName}</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            {/* Current Stock Display */}
            <Box
              w="100%"
              p={3}
              bg={useColorModeValue('gray.50', 'gray.800')}
              borderRadius="md"
              borderColor={borderColor}
              borderWidth={1}
            >
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Current Stock
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {currentAmount}
              </Text>
            </Box>

            {/* Update Type Toggle */}
            <FormControl>
              <FormLabel fontSize="sm">Update Type</FormLabel>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant={absolute ? 'solid' : 'outline'}
                  colorScheme={absolute ? 'blue' : 'gray'}
                  onClick={() => setAbsolute(true)}
                >
                  Set to
                </Button>
                <Button
                  size="sm"
                  variant={!absolute ? 'solid' : 'outline'}
                  colorScheme={!absolute ? 'blue' : 'gray'}
                  onClick={() => setAbsolute(false)}
                >
                  Add/Subtract
                </Button>
              </HStack>
            </FormControl>

            {/* Amount Input */}
            <FormControl isInvalid={!!error}>
              <FormLabel>
                {absolute ? 'Set Stock to' : 'Add/Subtract Amount'}
              </FormLabel>
              <Input
                type="number"
                placeholder={absolute ? 'Enter new stock amount' : 'Enter amount (use - for subtract)'}
                value={amount}
                onChange={handleAmountChange}
                bg={inputBg}
                borderColor={borderColor}
                step="0.01"
              />
              {error && <FormErrorMessage>{error}</FormErrorMessage>}
            </FormControl>

            {/* Preview */}
            {amount && !error && (
              <Box
                w="100%"
                p={3}
                bg={useColorModeValue('blue.50', 'blue.900')}
                borderRadius="md"
                borderColor={useColorModeValue('blue.200', 'blue.600')}
                borderWidth={1}
              >
                <Text fontSize="sm" color={useColorModeValue('blue.700', 'blue.200')}>
                  New Stock Amount
                </Text>
                <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('blue.800', 'blue.100')}>
                  {calculatedAmount}
                </Text>
              </Box>
            )}

            {/* Scanned By */}
            <FormControl>
              <FormLabel>Recorded By</FormLabel>
              <Input
                placeholder="e.g., manual, barcode, system"
                value={scannedBy}
                onChange={(e) => setScannedBy(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isLoading}
              loadingText="Updating..."
            >
              Update Stock
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
