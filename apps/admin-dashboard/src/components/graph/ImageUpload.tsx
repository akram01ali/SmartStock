import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Image,
  Text,
  VStack,
  HStack,
  Icon,
  useToast,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon, UploadIcon, ImageIcon } from '../common/IconWrapper';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string | null) => void;
  textColor: string;
  inputBg: string;
  borderColor: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  textColor,
  inputBg,
  borderColor,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsUploading(true);

    // Convert to base64 for now (in a real app, you'd upload to a server)
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
      setIsUploading(false);
      toast({
        title: 'Image uploaded',
        status: 'success',
        duration: 3000,
      });
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({
        title: 'Upload failed',
        description: 'Failed to process the image',
        status: 'error',
        duration: 3000,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <VStack spacing={3} align="stretch">
      <Text color={textColor} fontWeight="medium">
        Component Image
      </Text>
      
      <Box
        border="2px dashed"
        borderColor={borderColor}
        borderRadius="md"
        p={4}
        bg={inputBg}
        minH="200px"
        position="relative"
      >
        {value ? (
          <VStack spacing={3}>
            <Box position="relative" maxW="100%" maxH="180px">
              <Image
                src={value}
                alt="Component image"
                maxW="100%"
                maxH="180px"
                objectFit="contain"
                borderRadius="md"
              />
              <IconButton
                aria-label="Remove image"
                icon={<DeleteIcon size="sm" />}
                size="sm"
                colorScheme="red"
                position="absolute"
                top={2}
                right={2}
                onClick={handleRemove}
              />
            </Box>
            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<UploadIcon size="sm" />}
                onClick={handleUploadClick}
                isLoading={isUploading}
              >
                Change Image
              </Button>
            </HStack>
          </VStack>
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            h="100%"
            cursor="pointer"
            onClick={handleUploadClick}
            _hover={{ bg: 'gray.50' }}
            transition="background 0.2s"
          >
            <ImageIcon size="32px" color="gray.400" />
            <Text color="gray.500" fontSize="sm" textAlign="center">
              Click to upload an image
            </Text>
            <Text color="gray.400" fontSize="xs" textAlign="center" mt={1}>
              PNG, JPG up to 5MB
            </Text>
          </Flex>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </VStack>
  );
}; 