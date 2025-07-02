import { Box } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { Shit } from 'components/graph/canvas';

export default function GraphDagre() {
  const { componentName } = useParams();

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Box p={8}>
        <Shit />
      </Box>
    </Box>
  );
}
