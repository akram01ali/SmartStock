import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  useColorModeValue,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../../services/service';
import Card from 'components/card/Card';
import { MdGroups, MdPrint } from 'react-icons/md';

interface Component {
  componentName: string;
  amount: number;
  measure: 'centimeters' | 'meters' | 'amount';
  lastScanned: string;
  scannedBy: string;
  durationOfDevelopment: number;
  triggerMinAmount: number;
  supplier: string;
  cost: number;
  type: 'printer' | 'group' | 'component';
}

export default function ComponentsPage() {
  const [groups, setGroups] = useState<Component[]>([]);
  const [printers, setPrinters] = useState<Component[]>([]);
  const navigate = useNavigate();

  // Chakra Color Mode
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'white');
  const cardShadow = useColorModeValue(
    '0px 18px 40px rgba(112, 144, 176, 0.12)',
    'unset',
  );
  const iconBg = useColorModeValue('secondaryGray.300', 'navy.900');

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        console.log('Fetching components...');
        const [groupsData, printersData] = await Promise.all([
          ApiService.getGroups(),
          ApiService.getPrinters(),
        ]);
        console.log('Groups:', groupsData);
        console.log('Printers:', printersData);
        setGroups(groupsData);
        setPrinters(printersData);
      } catch (error) {
        console.error('Error fetching components:', error);
      }
    };

    fetchComponents();
  }, []);

  const handleCardClick = (componentName: string) => {
    navigate(`/admin/graph/${componentName}`);
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Box p={8}>
        <Heading size="xl" mb={8} color={textColor} fontWeight="700">
          Groups
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
          {groups.map((group) => (
            <Card
              key={group.componentName}
              onClick={() => handleCardClick(group.componentName)}
              cursor="pointer"
              p="20px"
              boxShadow={cardShadow}
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              color="white"
              borderRadius="20px"
              position="relative"
              overflow="hidden"
              _hover={{
                transform: 'translateY(-8px)',
                transition: 'all 0.3s ease',
                boxShadow: '0px 20px 60px rgba(112, 144, 176, 0.25)',
                filter: 'brightness(1.1)',
              }}
            >
              <Flex
                direction="column"
                align="center"
                justify="center"
                minH="120px"
              >
                <Box
                  bg="rgba(255, 255, 255, 0.2)"
                  borderRadius="16px"
                  p="12px"
                  mb="16px"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={MdGroups as any} w="32px" h="32px" color="white" />
                </Box>
                <Text
                  fontSize="lg"
                  fontWeight="700"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  {group.componentName}
                </Text>
              </Flex>
            </Card>
          ))}
        </SimpleGrid>

        <Heading size="xl" mt={16} mb={8} color={textColor} fontWeight="700">
          Printers
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
          {printers.map((printer) => (
            <Card
              key={printer.componentName}
              onClick={() => handleCardClick(printer.componentName)}
              cursor="pointer"
              p="20px"
              boxShadow={cardShadow}
              bg="linear-gradient(135deg, #868CFF 0%, #4318FF 100%)"
              color="white"
              borderRadius="20px"
              position="relative"
              overflow="hidden"
              _hover={{
                transform: 'translateY(-8px)',
                transition: 'all 0.3s ease',
                boxShadow: '0px 20px 60px rgba(67, 24, 255, 0.25)',
                filter: 'brightness(1.1)',
              }}
            >
              <Flex
                direction="column"
                align="center"
                justify="center"
                minH="120px"
              >
                <Box
                  bg="rgba(255, 255, 255, 0.2)"
                  borderRadius="16px"
                  p="12px"
                  mb="16px"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={MdPrint as any} w="32px" h="32px" color="white" />
                </Box>
                <Text
                  fontSize="lg"
                  fontWeight="700"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  {printer.componentName}
                </Text>
              </Flex>
            </Card>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
