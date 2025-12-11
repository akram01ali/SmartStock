import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Input,
  Text,
  useColorModeValue,
  Icon,
  Badge,
  Spinner,
  useToast,
  Heading,
  Divider,
} from '@chakra-ui/react';
import { DeleteIcon } from '../common/IconWrapper';
import { ApiService } from '../../services/service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Manual {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface ManualUploadProps {
  componentName: string;
  onManualsUpdated?: (manuals: Manual[]) => void;
}

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];

export default function ManualUpload({
  componentName,
  onManualsUpdated,
}: ManualUploadProps) {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState<string | null>(null);
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'navy.700');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'navy.600');
  const uploadBgColor = useColorModeValue('blue.50', 'blue.900');
  const uploadBorderColor = useColorModeValue('blue.200', 'blue.600');
  const uploadTextColor = useColorModeValue('blue.700', 'blue.200');
  const linkColor = useColorModeValue('#3182ce', '#63b3ed');
  const linkHoverColor = useColorModeValue('gray.100', 'navy.600');

  // Load manuals on mount
  useEffect(() => {
    loadManuals();
  }, [componentName]);

  const loadManuals = useCallback(async () => {
    try {
      setIsLoading(true);
      const manualsData = await ApiService.getComponentManuals(componentName);
      setManuals(manualsData || []);
    } catch (error) {
      console.error('Error loading manuals:', error);
      setManuals([]);
    } finally {
      setIsLoading(false);
    }
  }, [componentName]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      toast({
        title: 'Invalid File Type',
        description: `Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
        status: 'error',
        duration: 3000,
      });
      event.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 10MB',
        status: 'error',
        duration: 3000,
      });
      event.target.value = '';
      return;
    }

    try {
      setIsUploadingFile(true);
      await ApiService.uploadComponentManual(componentName, file);
      
      toast({
        title: 'Manual Uploaded',
        description: `${file.name} has been uploaded successfully`,
        status: 'success',
        duration: 3000,
      });

      await loadManuals();
      if (onManualsUpdated) {
        const updated = await ApiService.getComponentManuals(componentName);
        onManualsUpdated(updated || []);
      }
      event.target.value = '';
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload manual',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUploadingFile(false);
    }
  }, [componentName, toast, onManualsUpdated]);

  const handleDeleteManual = useCallback(async (manualId: string) => {
    try {
      setIsDeletingFile(manualId);
      await ApiService.deleteComponentManual(manualId);
      
      toast({
        title: 'Manual Deleted',
        description: 'The manual has been removed',
        status: 'success',
        duration: 3000,
      });

      await loadManuals();
      if (onManualsUpdated) {
        const updated = await ApiService.getComponentManuals(componentName);
        onManualsUpdated(updated || []);
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete manual',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDeletingFile(null);
    }
  }, [componentName, toast, onManualsUpdated]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileType: string) => {
    const iconMap: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📋',
      xls: '📊',
      xlsx: '📊',
      ppt: '🎯',
      pptx: '🎯',
    };
    return iconMap[fileType.toLowerCase()] || '📎';
  };

  return (
    <Box
      w="100%"
      p={6}
      bg={bgColor}
      borderRadius="lg"
      borderWidth={1}
      borderColor={borderColor}
    >
      <VStack align="stretch" spacing={4}>
        {/* Header */}
        <Box>
          <Heading size="md" color={textColor} mb={2}>
            📎 Manuals & Documents
          </Heading>
          <Text fontSize="sm" color={textColorSecondary}>
            Upload and manage component manuals, datasheets, and documentation
          </Text>
        </Box>

        <Divider />

        {/* Upload Section */}
        <Box
          p={4}
          bg={uploadBgColor}
          borderRadius="md"
          borderWidth={2}
          borderColor={uploadBorderColor}
          borderStyle="dashed"
          textAlign="center"
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            bg: useColorModeValue('blue.100', 'blue.800'),
            borderColor: useColorModeValue('blue.300', 'blue.500'),
          }}
        >
          <Input
            type="file"
            accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
            onChange={handleFileSelect}
            disabled={isUploadingFile}
            display="none"
            id="manual-upload-input"
          />
          <label htmlFor="manual-upload-input" style={{ cursor: 'pointer', width: '100%' }}>
            <VStack spacing={2}>
              <Text fontSize="2xl">📤</Text>
              {isUploadingFile ? (
                <>
                  <Spinner size="sm" color={uploadTextColor} />
                  <Text fontSize="sm" color={uploadTextColor} fontWeight="500">
                    Uploading...
                  </Text>
                </>
              ) : (
                <>
                  <Text fontSize="sm" color={uploadTextColor} fontWeight="500">
                    Click to upload or drag and drop
                  </Text>
                  <Text fontSize="xs" color={uploadTextColor}>
                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (max 10MB)
                  </Text>
                </>
              )}
            </VStack>
          </label>
        </Box>

        {/* Manuals List */}
        {isLoading ? (
          <VStack py={4}>
            <Spinner />
            <Text fontSize="sm" color={textColorSecondary}>
              Loading manuals...
            </Text>
          </VStack>
        ) : manuals.length === 0 ? (
          <Text fontSize="sm" color={textColorSecondary} textAlign="center" py={4}>
            No manuals uploaded yet
          </Text>
        ) : (
          <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto">
            {manuals.map((manual) => (
              <HStack
                key={manual.id}
                p={3}
                bg={hoverBg}
                borderRadius="md"
                borderWidth={1}
                borderColor={borderColor}
                justify="space-between"
                _hover={{
                  bg: linkHoverColor,
                }}
              >
                <HStack spacing={3} flex={1} minW={0}>
                  <Text fontSize="lg">{getFileIcon(manual.fileType)}</Text>
                  <VStack align="start" spacing={0} flex={1} minW={0}>
                    <a
                      href={`${API_URL}${manual.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: linkColor,
                        textDecoration: 'none',
                        wordBreak: 'break-word',
                      }}
                    >
                      <Text fontSize="sm" fontWeight="500" _hover={{ textDecoration: 'underline' }}>
                        {manual.fileName}
                      </Text>
                    </a>
                    <HStack spacing={2} fontSize="xs" color={textColorSecondary}>
                      <Badge size="sm" variant="subtle">
                        {manual.fileType.toUpperCase()}
                      </Badge>
                      <Text>{formatDate(manual.uploadedAt)}</Text>
                      <Text>{manual.uploadedBy}</Text>
                    </HStack>
                  </VStack>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  isLoading={isDeletingFile === manual.id}
                  onClick={() => handleDeleteManual(manual.id)}
                  leftIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
