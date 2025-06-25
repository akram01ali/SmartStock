import { Box } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import Canvas from 'components/flowchart/canvas';

export default function Graph() {
  const { componentName } = useParams();

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Box p={8}>
        <Canvas initialComponent={componentName} />
      </Box>
    </Box>
  );
}
