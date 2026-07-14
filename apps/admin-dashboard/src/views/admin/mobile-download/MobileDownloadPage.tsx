import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Spinner,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  Badge,
} from '@chakra-ui/react';
import {
  MdPhoneAndroid,
  MdUpload,
  MdDelete,
  MdContentCopy,
  MdCheckCircle,
  MdInfo,
} from 'react-icons/md';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ApkInfo {
  original_filename: string;
  uploaded_at: string;
  uploaded_by: string;
  size_bytes: number;
  apk_path: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function MobileDownloadPage() {
  const [apkInfo, setApkInfo] = useState<ApkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const subtextColor = useColorModeValue('gray.500', 'gray.400');
  const qrBg = useColorModeValue('#ffffff', '#ffffff');
  const infoBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const urlInputBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const instructionBg = useColorModeValue('blue.50', 'blue.900');
  const instructionBorder = useColorModeValue('blue.100', 'blue.700');
  const instructionHeading = useColorModeValue('blue.700', 'blue.200');
  const instructionText = useColorModeValue('blue.600', 'blue.300');

  const downloadUrl = apkInfo ? `${API_URL}${apkInfo.apk_path}` : null;

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/mobile-app/info`);
      if (res.status === 404) {
        setApkInfo(null);
      } else if (res.ok) {
        setApkInfo(await res.json());
      }
    } catch {
      setApkInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.apk')) {
      toast({ title: 'Only .apk files are allowed', status: 'error', duration: 3000 });
      return;
    }

    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/mobile-app/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'APK uploaded successfully', status: 'success', duration: 3000 });
      await fetchInfo();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove the stored APK? The QR code will stop working.')) return;
    const token = localStorage.getItem('authToken');
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/mobile-app/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'APK removed', status: 'info', duration: 3000 });
      setApkInfo(null);
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = () => {
    if (!downloadUrl) return;
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }} px={{ base: 4, md: 8 }}>
      <Flex align="center" mb={6} gap={3}>
        <Icon as={MdPhoneAndroid as any} boxSize={7} color="brand.500" />
        <Heading size="lg">Mobile App Download</Heading>
      </Flex>

      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap={6}
        align={{ base: 'stretch', lg: 'flex-start' }}
      >
        {/* QR Code card */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          border="1px solid"
          borderColor={borderColor}
          p={8}
          flex="0 0 auto"
          w={{ base: '100%', lg: '340px' }}
        >
          <VStack spacing={5}>
            <Heading size="sm" color={subtextColor} letterSpacing="wide" textTransform="uppercase">
              Scan to Download
            </Heading>

            {loading ? (
              <Spinner size="xl" color="brand.500" my={10} />
            ) : downloadUrl ? (
              <>
                <Box bg={qrBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                  <QRCode value={downloadUrl} size={220} />
                </Box>
                <Text fontSize="xs" color={subtextColor} textAlign="center">
                  Point your phone camera at the QR code to download the SmartStock app
                </Text>
                <Badge colorScheme="green" px={3} py={1} borderRadius="full" fontSize="xs">
                  APK ready
                </Badge>
              </>
            ) : (
              <VStack spacing={3} py={10}>
                <Icon as={MdPhoneAndroid as any} boxSize={12} color="gray.300" />
                <Text color={subtextColor} textAlign="center" fontSize="sm">
                  No APK uploaded yet. Upload one to generate the QR code.
                </Text>
              </VStack>
            )}
          </VStack>
        </Box>

        {/* Info + actions card */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          border="1px solid"
          borderColor={borderColor}
          p={8}
          flex="1"
        >
          <VStack align="stretch" spacing={6}>
            <Heading size="md">APK Management</Heading>

            {/* Current APK info */}
            {apkInfo && (
              <Box
                bg={infoBg}
                borderRadius="xl"
                p={5}
                border="1px solid"
                borderColor={borderColor}
              >
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <Icon as={MdCheckCircle as any} color="green.400" />
                    <Text fontWeight="semibold">{apkInfo.original_filename}</Text>
                  </HStack>
                  <Divider />
                  <HStack justify="space-between" fontSize="sm">
                    <Text color={subtextColor}>Size</Text>
                    <Text fontWeight="medium">{formatBytes(apkInfo.size_bytes)}</Text>
                  </HStack>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color={subtextColor}>Uploaded</Text>
                    <Text fontWeight="medium">{formatDate(apkInfo.uploaded_at)}</Text>
                  </HStack>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color={subtextColor}>Uploaded by</Text>
                    <Text fontWeight="medium">{apkInfo.uploaded_by}</Text>
                  </HStack>
                </VStack>
              </Box>
            )}

            {/* Download URL */}
            {downloadUrl && (
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  Download URL
                </Text>
                <HStack>
                  <Input
                    value={downloadUrl}
                    isReadOnly
                    fontSize="xs"
                    bg={urlInputBg}
                    borderRadius="lg"
                  />
                  <Button
                    leftIcon={<Icon as={copied ? MdCheckCircle : MdContentCopy as any} />}
                    colorScheme={copied ? 'green' : 'gray'}
                    variant="outline"
                    onClick={handleCopy}
                    flexShrink={0}
                    size="md"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </HStack>
              </Box>
            )}

            <Divider />

            {/* Upload */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                {apkInfo ? 'Replace APK' : 'Upload APK'}
              </Text>
              <Text fontSize="xs" color={subtextColor} mb={3}>
                {apkInfo
                  ? 'Uploading a new file will replace the current one and update the QR code instantly.'
                  : 'Upload your .apk file to host it here and generate a permanent QR code.'}
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk"
                style={{ display: 'none' }}
                onChange={handleUpload}
              />
              <HStack>
                <Button
                  leftIcon={<Icon as={MdUpload as any} />}
                  colorScheme="brand"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploading}
                  loadingText="Uploading…"
                >
                  Choose .apk file
                </Button>
                {apkInfo && (
                  <Button
                    leftIcon={<Icon as={MdDelete as any} />}
                    colorScheme="red"
                    variant="outline"
                    onClick={handleDelete}
                    isLoading={deleting}
                    loadingText="Removing…"
                  >
                    Remove
                  </Button>
                )}
              </HStack>
            </Box>

            {/* Instructions */}
            <Box
              bg={instructionBg}
              borderRadius="xl"
              p={5}
              border="1px solid"
              borderColor={instructionBorder}
            >
              <HStack align="flex-start" spacing={3}>
                <Icon as={MdInfo as any} color="blue.400" mt={0.5} flexShrink={0} />
                <VStack align="stretch" spacing={1} fontSize="sm">
                  <Text fontWeight="semibold" color={instructionHeading}>
                    How to install on Android
                  </Text>
                  <Text color={instructionText}>
                    1. Scan the QR code with your phone camera
                  </Text>
                  <Text color={instructionText}>
                    2. Tap the download link in the browser
                  </Text>
                  <Text color={instructionText}>
                    3. Open the downloaded file and tap <strong>Install</strong>
                  </Text>
                  <Text color={instructionText}>
                    4. If prompted, allow installation from unknown sources in Settings
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
}
