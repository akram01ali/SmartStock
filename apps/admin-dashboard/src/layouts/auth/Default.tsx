// Chakra imports
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import Footer from 'components/footer/FooterAuth';
import FixedPlugin from 'components/fixedPlugin/FixedPlugin';
// Custom components
import { NavLink } from 'react-router-dom';
// Assets
import { FaChevronLeft } from 'react-icons/fa';
import { ReactNode } from 'react';

function AuthIllustration(props: { children: ReactNode; illustrationBackground: string }) {
	const { children } = props;
	// Chakra color mode
	return (
		<Flex position='relative' h='100vh' align='center' justify='center' direction='column'>
			<NavLink
				to='/admin'
				style={() => ({
					width: 'fit-content',
					marginTop: '40px'
				})}>
				<Flex align='center' ps={{ base: '25px', lg: '0px' }} pt={{ lg: '0px', xl: '0px' }} w='fit-content'>
					<Icon as={FaChevronLeft} me='12px' h='13px' w='8px' color='#718096' />
					<Text ms='0px' fontSize='sm' color='secondaryGray.600'>
						Back to Simmmple
					</Text>
				</Flex>
			</NavLink>
			{children}
			<Footer />
			<FixedPlugin />
		</Flex>
	);
}
// PROPS

AuthIllustration.propTypes = {
	illustrationBackground: PropTypes.string,
	image: PropTypes.any
};

export default AuthIllustration;
