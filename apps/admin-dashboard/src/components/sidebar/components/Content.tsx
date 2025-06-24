// chakra imports
import { Box, Flex, Stack, Image } from '@chakra-ui/react';
//   Custom components
import Links from 'components/sidebar/components/Links';
import SidebarCard from 'components/sidebar/components/SidebarCard';
// Import the iacs.png image
import iacsLogo from 'assets/img/iacs.png';

// FUNCTIONS

function SidebarContent(props: { routes: RoutesType[] }) {
	const { routes } = props;
	// SIDEBAR
	return (
		<Flex direction='column' height='100%' pt='25px' borderRadius='30px'>
			{/* Replace Brand with the iacs.png image */}
			<Box display='flex' justifyContent='center' alignItems='center' mb='16px'>
				<Image src={iacsLogo} alt='IACS Logo' h='80px' />
			</Box>
			<Stack direction='column' mt='8px' mb='auto'>
				<Box ps='20px' pe={{ lg: '16px', '2xl': '16px' }}>
					<Links routes={routes} />
				</Box>
			</Stack>
		</Flex>
	);
}

export default SidebarContent;
