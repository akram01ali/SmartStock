import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  useToast,
  Spinner,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  List,
  ListItem,
  Icon,
  Flex,
  SimpleGrid,
} from '@chakra-ui/react';
import { MdSearch, MdDownload, MdClose, MdPrint } from 'react-icons/md';
import Fuse from 'fuse.js';
import * as XLSX from 'xlsx';

import { ApiService } from '../../../services/service';
import SmoothCard from 'components/card/MotionCard';
import SmoothMotionBox, { fadeIn } from 'components/transitions/MotionBox';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BomRow {
  component_name: string;
  depth: number;
  material_cost: number;
  labor_cost: number;
  total_cost: number;
  amount: number;
  min_amount: number;
  supplier: string;
  type: string;
  delivery_time: number | null;
  location: string | null;
  has_manual: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeColor(type: string) {
  switch (type) {
    case 'printer':   return 'blue';
    case 'group':     return 'purple';
    case 'assembly':  return 'green';
    case 'component': return 'orange';
    default:          return 'gray';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const [allNames, setAllNames] = useState<string[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(true);

  // Search / selection state
  const [searchInput, setSearchInput] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [bomData, setBomData] = useState<BomRow[] | null>(null);
  const [loadingBom, setLoadingBom] = useState(false);
  const [exporting, setExporting] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // ── Color tokens (all at top level — no conditional hooks) ─────────────────
  const textColor        = useColorModeValue('secondaryGray.900', 'white');
  const subText          = useColorModeValue('secondaryGray.600', 'gray.400');
  const cardShadow       = useColorModeValue('0px 18px 40px rgba(112,144,176,0.12)', 'unset');
  const inputBg          = useColorModeValue('gray.100', 'gray.700');
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  const theadBg          = useColorModeValue('gray.50', 'navy.800');
  const dropdownBg       = useColorModeValue('white', 'navy.700');
  const dropdownBorder   = useColorModeValue('gray.200', 'gray.600');
  const dropdownHover    = useColorModeValue('gray.50', 'whiteAlpha.100');
  const selectedChipBg   = useColorModeValue('blue.50', 'blue.900');
  const selectedChipColor = useColorModeValue('blue.700', 'blue.200');

  // ── Load component names ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await ApiService.getAllComponents() as { componentName: string }[];
        setAllNames(data.map((c) => c.componentName));
      } catch {
        toast({ title: 'Failed to load components', status: 'error', duration: 3000 });
      } finally {
        setLoadingComponents(false);
      }
    })();
  }, [toast]);

  // ── Fuse.js fuzzy search ───────────────────────────────────────────────────
  const fuse = useMemo(
    () => new Fuse(allNames, { threshold: 0.35, distance: 100, minMatchCharLength: 1 }),
    [allNames],
  );

  const suggestions = useMemo<string[]>(() => {
    if (!searchInput.trim()) return allNames.slice(0, 10);
    return fuse.search(searchInput).map((r) => r.item).slice(0, 10);
  }, [searchInput, fuse, allNames]);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback((name: string) => {
    setSelectedName(name);
    setSearchInput(name);
    setShowSuggestions(false);
    setBomData(null);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedName('');
    setSearchInput('');
    setBomData(null);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setSelectedName('');
    setBomData(null);
    setShowSuggestions(true);
  }, []);

  const handlePreview = useCallback(async () => {
    if (!selectedName) {
      toast({ title: 'Please select a component', status: 'warning', duration: 2000 });
      return;
    }
    setLoadingBom(true);
    setBomData(null);
    try {
      const rows = await ApiService.getBomExport(selectedName) as BomRow[];
      setBomData(rows);
    } catch (err: any) {
      toast({ title: 'Failed to load BOM', description: err?.message ?? 'Unknown error', status: 'error', duration: 4000 });
    } finally {
      setLoadingBom(false);
    }
  }, [selectedName, toast]);

  const handlePrint = useCallback(() => {
    if (!bomData || bomData.length === 0) return;

    const rows = bomData.map((row) => `
      <tr>
        <td style="padding-left:${row.depth * 14 + 4}px">${row.depth > 0 ? '└ ' : ''}${row.component_name}</td>
        <td>${row.depth}</td>
        <td>€${row.material_cost.toFixed(2)}</td>
        <td>€${row.labor_cost.toFixed(2)}</td>
        <td><strong>€${row.total_cost.toFixed(2)}</strong></td>
        <td>${row.amount}</td>
        <td>${row.min_amount}</td>
        <td>${row.supplier || '—'}</td>
        <td>${row.type || '—'}</td>
        <td>${row.delivery_time ?? '—'}</td>
        <td>${row.location || '—'}</td>
        <td>${row.has_manual ? '✓' : '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>BOM — ${selectedName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 16px; }
    h2 { font-size: 14px; margin-bottom: 4px; }
    p.meta { font-size: 9px; color: #666; margin-bottom: 12px; }
    table { border-collapse: collapse; width: 100%; table-layout: auto; }
    th { background: #e8ecf0; font-size: 9px; text-transform: uppercase;
         letter-spacing: .4px; padding: 5px 6px; border: 1px solid #ccc; white-space: nowrap; }
    td { padding: 4px 6px; border: 1px solid #ddd; vertical-align: middle; }
    tr:nth-child(even) td { background: #f9f9f9; }
    @page { margin: 12mm; size: A4 landscape; }
  </style>
</head>
<body>
  <h2>Bill of Materials — ${selectedName}</h2>
  <p class="meta">Generated ${new Date().toLocaleString()} · ${bomData.length} components</p>
  <table>
    <thead>
      <tr>
        <th>Component</th><th>Depth</th><th>Mat. Cost</th><th>Labor Cost</th>
        <th>Total Cost</th><th>Amount</th><th>Min</th><th>Supplier</th>
        <th>Type</th><th>Del. Time</th><th>Location</th><th>Manual</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1000,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }, [bomData, selectedName]);

  const handleExport = useCallback(async () => {
    if (!bomData || bomData.length === 0) return;
    setExporting(true);
    try {
      const sheetRows = bomData.map((row) => ({
        'Component Name': row.component_name,
        'Tree Depth':     row.depth,
        'Material Cost':  row.material_cost,
        'Labor Cost':     row.labor_cost,
        'Total Cost':     row.total_cost,
        'Amount':         row.amount,
        'Minimum Amount': row.min_amount,
        'Supplier':       row.supplier,
        'Type':           row.type,
        'Delivery Time':  row.delivery_time ?? '',
        'Location':       row.location ?? '',
        'Has Manual':     row.has_manual,
      }));

      const ws = XLSX.utils.json_to_sheet(sheetRows);
      ws['!cols'] = [
        { wch: 35 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
        { wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 16 },
        { wch: 20 }, { wch: 12 },
      ];

      // Explicitly mark numeric columns
      const numericCols = ['B', 'C', 'D', 'E', 'F', 'G', 'J'];
      for (let r = 1; r <= sheetRows.length; r++) {
        numericCols.forEach((col) => {
          const ref = `${col}${r + 1}`;
          if (ws[ref] && ws[ref].v !== '' && ws[ref].v != null) ws[ref].t = 'n';
        });
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOM');
      XLSX.writeFile(wb, `BOM_${selectedName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: 'Excel downloaded', status: 'success', duration: 2000 });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err?.message, status: 'error', duration: 4000 });
    } finally {
      setExporting(false);
    }
  }, [bomData, selectedName, toast]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }} variants={fadeIn}>
      <VStack align="stretch" spacing={8}>

        {/* Page header */}
        <Box>
          <Heading size="lg" color={textColor} mb={1}>BOM Export</Heading>
          <Text color={subText} fontSize="sm">
            Select a top-level component, configure the hourly labor rate, preview the full
            bill-of-materials and download as Excel.
          </Text>
        </Box>

        {/* Settings card */}
        <SmoothCard boxShadow={cardShadow} p={6}>
          <VStack align="stretch" spacing={6}>
            <Text fontWeight="700" fontSize="md" color={textColor}>Export settings</Text>
            <Divider />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>

              {/* Component fuzzy-search picker */}
              <FormControl>
                <FormLabel color={textColor} fontSize="sm" fontWeight="600">Top Component</FormLabel>

                {/* Selected chip */}
                {selectedName && (
                  <Flex
                    align="center"
                    justify="space-between"
                    mb={2}
                    px={3}
                    py={2}
                    bg={selectedChipBg}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="blue.200"
                  >
                    <Text fontSize="sm" fontWeight="600" color={selectedChipColor} noOfLines={1}>
                      {selectedName}
                    </Text>
                    <Icon
                      as={MdClose as any}
                      cursor="pointer"
                      color={selectedChipColor}
                      onClick={handleClearSelection}
                      ml={2}
                    />
                  </Flex>
                )}

                {/* Search input + dropdown */}
                <Box position="relative" ref={searchBoxRef}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      {loadingComponents
                        ? <Spinner size="xs" color="gray.400" />
                        : <Icon as={MdSearch as any} color="gray.400" />}
                    </InputLeftElement>
                    <Input
                      placeholder={loadingComponents ? 'Loading components…' : 'Search components…'}
                      value={searchInput}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      bg={inputBg}
                      isDisabled={loadingComponents}
                      autoComplete="off"
                    />
                  </InputGroup>

                  {showSuggestions && suggestions.length > 0 && (
                    <Box
                      position="absolute"
                      top="100%"
                      left={0}
                      right={0}
                      mt={1}
                      bg={dropdownBg}
                      border="1px solid"
                      borderColor={dropdownBorder}
                      borderRadius="md"
                      boxShadow="lg"
                      zIndex={1000}
                      maxH="220px"
                      overflowY="auto"
                    >
                      <List>
                        {suggestions.map((name, idx) => (
                          <ListItem
                            key={name}
                            px={4}
                            py={2}
                            cursor="pointer"
                            fontSize="sm"
                            color={textColor}
                            _hover={{ bg: dropdownHover }}
                            borderBottom={idx < suggestions.length - 1 ? '1px solid' : 'none'}
                            borderColor={dropdownBorder}
                            onMouseDown={() => handleSelect(name)}
                          >
                            {name}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>

                <FormHelperText fontSize="xs" color={subText}>
                  The entire BOM tree under this component will be exported.
                </FormHelperText>
              </FormControl>

            </SimpleGrid>

            {/* Action buttons */}
            <HStack spacing={3} pt={2}>
              <Button
                leftIcon={<Icon as={MdSearch as any} />}
                colorScheme="blue"
                onClick={handlePreview}
                isLoading={loadingBom}
                loadingText="Loading BOM…"
                isDisabled={!selectedName}
              >
                Preview BOM
              </Button>
              <Button
                leftIcon={<Icon as={MdDownload as any} />}
                colorScheme="green"
                onClick={handleExport}
                isLoading={exporting}
                loadingText="Exporting…"
                isDisabled={!bomData || bomData.length === 0}
              >
                Download Excel
              </Button>
            </HStack>
          </VStack>
        </SmoothCard>

        {/* Loading state */}
        {loadingBom && (
          <SmoothCard boxShadow={cardShadow} p={12}>
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.400" thickness="4px" />
              <Text color={subText} fontWeight="500">Building BOM tree for <b>{selectedName}</b>…</Text>
            </VStack>
          </SmoothCard>
        )}

        {/* Preview table */}
        {bomData && !loadingBom && (
          <SmoothCard boxShadow={cardShadow} p={0} overflow="hidden">
            {/* Table header bar */}
            <Flex
              px={5}
              py={4}
              borderBottomWidth="1px"
              borderColor={tableBorderColor}
              align="center"
              justify="space-between"
            >
              <VStack align="start" spacing={0}>
                <Text fontWeight="700" fontSize="md" color={textColor}>
                  Preview — {selectedName}
                </Text>
                <Text fontSize="xs" color={subText}>
                  {bomData.length} rows · labor costs from stage profiles
                </Text>
              </VStack>
              <HStack spacing={2}>
                <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
                  {bomData.length} components
                </Badge>
                <Button
                  leftIcon={<Icon as={MdPrint as any} />}
                  colorScheme="purple"
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                >
                  Print PDF
                </Button>
                <Button
                  leftIcon={<Icon as={MdDownload as any} />}
                  colorScheme="green"
                  size="sm"
                  onClick={handleExport}
                  isLoading={exporting}
                >
                  Download Excel
                </Button>
              </HStack>
            </Flex>

            <TableContainer maxH="560px" overflowY="auto">
              <Table size="sm" variant="simple">
                <Thead bg={theadBg} position="sticky" top={0} zIndex={1}>
                  <Tr>
                    <Th>Component</Th>
                    <Th isNumeric>Depth</Th>
                    <Th isNumeric>Mat. Cost</Th>
                    <Th isNumeric>Labor Cost</Th>
                    <Th isNumeric>Total Cost</Th>
                    <Th isNumeric>Amount</Th>
                    <Th isNumeric>Min</Th>
                    <Th>Supplier</Th>
                    <Th>Type</Th>
                    <Th isNumeric>Del. Time</Th>
                    <Th>Location</Th>
                    <Th>Manual</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {bomData.map((row, idx) => (
                    <Tr key={idx}>
                      <Td maxW="280px">
                        <Text
                          fontSize="xs"
                          fontFamily="mono"
                          color={textColor}
                          pl={`${row.depth * 16}px`}
                          noOfLines={1}
                          title={row.component_name}
                        >
                          {row.depth > 0 ? '└ ' : ''}{row.component_name}
                        </Text>
                      </Td>
                      <Td isNumeric>{row.depth}</Td>
                      <Td isNumeric>€{row.material_cost.toFixed(2)}</Td>
                      <Td isNumeric>€{row.labor_cost.toFixed(2)}</Td>
                      <Td isNumeric fontWeight="600">€{row.total_cost.toFixed(2)}</Td>
                      <Td isNumeric>{row.amount}</Td>
                      <Td isNumeric>{row.min_amount}</Td>
                      <Td maxW="160px">
                        <Text fontSize="xs" noOfLines={1} title={row.supplier}>
                          {row.supplier || '—'}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={typeColor(row.type)} size="sm" textTransform="capitalize">
                          {row.type || '—'}
                        </Badge>
                      </Td>
                      <Td isNumeric>{row.delivery_time ?? '—'}</Td>
                      <Td maxW="140px">
                        <Text fontSize="xs" noOfLines={1} title={row.location ?? ''}>
                          {row.location || '—'}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={row.has_manual ? 'green' : 'gray'} size="sm">
                          {row.has_manual ? 'Yes' : 'No'}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </SmoothCard>
        )}
      </VStack>
    </SmoothMotionBox>
  );
}
