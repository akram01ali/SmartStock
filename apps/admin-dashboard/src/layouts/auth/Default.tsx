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
