import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from '@xyflow/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  useDisclosure,
  useToast,
  Spinner,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { ApiService } from '../../services/service';

import '@xyflow/react/dist/style.css';

// Color palette for different hierarchy levels
const getNodeColor = (level) => {
  const colors = [
    '#4318FF', // Level 0 - Primary brand color
    '#6B46C1', // Level 1 - Purple
    '#7C3AED', // Level 2 - Violet
    '#8B5CF6', // Level 3 - Light purple
    '#A78BFA', // Level 4 - Lighter purple
    '#C4B5FD', // Level 5 - Very light purple
    '#DDD6FE', // Level 6+ - Pale purple
  ];
  return colors[Math.min(level, colors.length - 1)];
};

// Calculate node positions using a hierarchical layout
const calculateNodePositions = (treeData, rootComponent) => {
  const positions = new Map();
  const levels = new Map();
  const visited = new Set();
  
  // First pass: determine levels
  const setLevels = (nodeName, level = 0) => {
    if (visited.has(nodeName)) return;
    visited.add(nodeName);
    levels.set(nodeName, level);
    
    if (treeData[nodeName]) {
      treeData[nodeName].forEach(([childName]) => {
        setLevels(childName, level + 1);
      });
    }
  };
  
  setLevels(rootComponent);
  
  // Group nodes by level
  const nodesByLevel = new Map();
  for (const [nodeName, level] of levels.entries()) {
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level).push(nodeName);
  }
  
  // Calculate positions for each level
  const nodeWidth = 160;
  const nodeHeight = 80;
  const levelHeight = 200;
  const minNodeSpacing = 40;
  
  for (const [level, nodes] of nodesByLevel.entries()) {
    const nodeCount = nodes.length;
    const totalWidth = nodeCount * nodeWidth + (nodeCount - 1) * minNodeSpacing;
    const startX = -totalWidth / 2;
    
    nodes.forEach((nodeName, index) => {
      const x = startX + index * (nodeWidth + minNodeSpacing) + nodeWidth / 2;
      const y = level * levelHeight;
      positions.set(nodeName, { x, y });
    });
  }
  
  return { positions, levels };
};

export default function Flow({ initialComponent }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [componentData, setComponentData] = useState(null);
  const [editedComponent, setEditedComponent] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Handle node clicks for selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Handle double-click to open component dialog
  const onNodeDoubleClick = useCallback(async (event, node) => {
    const componentName = node.data.label;
    
    try {
      setDialogLoading(true);
      onOpen();
      
      const data = await ApiService.getComponent(componentName);
      setComponentData(data);
      setEditedComponent({ ...data });
    } catch (error) {
      console.error('Error fetching component:', error);
      toast({
        title: 'Error',
        description: `Failed to load component data: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } finally {
      setDialogLoading(false);
    }
  }, [onOpen, onClose, toast]);

  // Handle saving component changes
  const handleSaveComponent = async () => {
    if (!editedComponent || !componentData) return;
    
    try {
      setSaving(true);
      await ApiService.updateComponent(componentData.name, editedComponent);
      
      toast({
        title: 'Success',
        description: 'Component updated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
      setComponentData(null);
      setEditedComponent(null);
    } catch (error) {
      console.error('Error updating component:', error);
      toast({
        title: 'Error',
        description: `Failed to update component: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle closing dialog
  const handleCloseDialog = () => {
    onClose();
    setComponentData(null);
    setEditedComponent(null);
  };

  useEffect(() => {
    function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTreeData = async () => {
      if (!initialComponent) return;
      
      try {
        setLoading(true);
        const response = await ApiService.getTree(initialComponent);
        const treeData = response.tree;
        
        // Calculate optimal positions and levels
        const { positions, levels } = calculateNodePositions(treeData, initialComponent);
        
        // Create nodes with calculated positions and level-based colors
        const newNodes = [];
        const nodePositions = new Map();
        let nodeId = 0;
        
        for (const [nodeName, position] of positions.entries()) {
          const level = levels.get(nodeName) || 0;
          const currentNodeId = `node-${nodeId++}`;
          nodePositions.set(nodeName, currentNodeId);
          
          const nodeColor = getNodeColor(level);
          const isRoot = level === 0;
          
          const newNode = {
            id: currentNodeId,
            position,
            data: { 
              label: nodeName,
            },
            style: {
              background: `linear-gradient(135deg, ${nodeColor} 0%, ${nodeColor}dd 100%)`,
              color: 'white',
              border: isRoot ? '3px solid #FFD700' : '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              fontSize: isRoot ? '16px' : '14px',
              fontWeight: isRoot ? '800' : '600',
              minWidth: '140px',
              minHeight: '60px',
              textAlign: 'center',
              boxShadow: `0 8px 32px rgba(67, 24, 255, ${0.3 - level * 0.05})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            },
            className: 'custom-node',
          };
          
          newNodes.push(newNode);
        }
        
        // Create edges with professional styling
        const newEdges = [];
        Object.keys(treeData).forEach(parentName => {
          const parentNodeId = nodePositions.get(parentName);
          if (parentNodeId && treeData[parentName]) {
            treeData[parentName].forEach(([childName, amount]) => {
              const childNodeId = nodePositions.get(childName);
              if (childNodeId) {
                const parentLevel = levels.get(parentName) || 0;
                const edgeColor = getNodeColor(parentLevel);
                
                const edge = {
                  id: `edge-${parentName}-${childName}`,
                  source: parentNodeId,
                  target: childNodeId,
                  label: `${amount}`,
                  type: 'step',
                  animated: true,
                  style: { 
                    stroke: edgeColor, 
                    strokeWidth: 3,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  },
                  labelStyle: { 
                    fill: edgeColor, 
                    fontWeight: '700',
                    fontSize: '13px',
                    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                  },
                  labelBgStyle: { 
                    fill: 'white', 
                    fillOpacity: 0.95,
                    rx: 6,
                    ry: 6,
                  },
                  labelBgPadding: [8, 12],
                  labelBgBorderRadius: 6,
                };
                newEdges.push(edge);
              }
            });
          }
        });
        
        setNodes(newNodes);
        setEdges(newEdges);
        
      } catch (error) {
        console.error('Error fetching tree data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTreeData();
  }, [initialComponent]);

  // Update node styles based on selection
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: {
          ...node.style,
          boxShadow: selectedNodeId === node.id 
            ? '0 12px 48px rgba(67, 24, 255, 0.6)' 
            : node.style.boxShadow,
          border: selectedNodeId === node.id 
            ? '3px solid #FFD700' 
            : node.style.border,
        },
        className: selectedNodeId === node.id ? 'custom-node selected-node' : 'custom-node',
      }))
    );
  }, [selectedNodeId, setNodes]);

  const flowStyles = {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    width: '100%',
    height: `${dimensions.height * 0.85}px`,
    position: 'relative',
  };

  if (loading) {
    return (
      <div style={flowStyles}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          fontSize: '20px',
          fontWeight: '600',
          color: '#4318FF',
          background: 'white',
          margin: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #4318FF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}></div>
            Loading component tree for "{initialComponent}"...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={flowStyles}>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .custom-node:hover {
            transform: scale(1.05) !important;
            box-shadow: 0 12px 48px rgba(67, 24, 255, 0.4) !important;
          }
          .selected-node {
            transform: scale(1.05) !important;
          }
        `}</style>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
          fitViewOptions={{
            padding: 0.15,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
          attributionPosition="bottom-left"
          nodesDraggable={true}
          edgesUpdatable={false}
          snapToGrid={true}
          snapGrid={[20, 20]}
        >
          <MiniMap
            nodeStrokeWidth={2}
            nodeColor="#4318FF"
            nodeBorderRadius={12}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              backgroundColor: 'rgba(255,255,255,0.95)',
              height: 140,
              width: 200,
              border: '2px solid rgba(67, 24, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(10px)',
            }}
          />
          <Controls 
            style={{
              button: {
                backgroundColor: 'rgba(255,255,255,0.95)',
                color: '#4318FF',
                border: '2px solid rgba(67, 24, 255, 0.2)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }
            }}
          />
          <Background 
            variant="dots" 
            gap={20} 
            size={1.5} 
            color="rgba(67, 24, 255, 0.15)"
          />
          <Panel position="top-left">
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              padding: '16px 24px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              fontSize: '18px',
              fontWeight: '700',
              color: '#2d3748',
              border: '2px solid rgba(67, 24, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            }}>
              📊 Component Hierarchy: <span style={{ color: '#4318FF' }}>{initialComponent}</span>
            </div>
          </Panel>
          <Panel position="bottom-left">
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              fontSize: '12px',
              color: '#64748b',
              backdropFilter: 'blur(10px)',
              maxWidth: '250px',
            }}>
              💡 <strong>Tip:</strong> Click to select, double-click to edit component
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Component Edit Dialog */}
      <Modal isOpen={isOpen} onClose={handleCloseDialog} size="xl">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Text>🔧 Edit Component</Text>
              {componentData && (
                <Text color="#4318FF" fontSize="md">
                  {componentData.name}
                </Text>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {dialogLoading ? (
              <VStack spacing={4} py={8}>
                <Spinner size="lg" color="#4318FF" />
                <Text>Loading component data...</Text>
              </VStack>
            ) : componentData && editedComponent ? (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Component Name</FormLabel>
                  <Input
                    value={editedComponent.name || ''}
                    onChange={(e) => 
                      setEditedComponent({ ...editedComponent, name: e.target.value })
                    }
                    placeholder="Enter component name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={editedComponent.description || ''}
                    onChange={(e) => 
                      setEditedComponent({ ...editedComponent, description: e.target.value })
                    }
                    placeholder="Enter component description"
                    rows={3}
                  />
                </FormControl>

                <HStack spacing={4} width="100%">
                  <FormControl>
                    <FormLabel>Quantity</FormLabel>
                    <NumberInput
                      value={editedComponent.quantity || 0}
                      onChange={(valueString, valueNumber) =>
                        setEditedComponent({ ...editedComponent, quantity: valueNumber })
                      }
                      min={0}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Unit Cost</FormLabel>
                    <NumberInput
                      value={editedComponent.unit_cost || 0}
                      onChange={(valueString, valueNumber) =>
                        setEditedComponent({ ...editedComponent, unit_cost: valueNumber })
                      }
                      min={0}
                      precision={2}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Category</FormLabel>
                  <Input
                    value={editedComponent.category || ''}
                    onChange={(e) => 
                      setEditedComponent({ ...editedComponent, category: e.target.value })
                    }
                    placeholder="Enter component category"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Supplier</FormLabel>
                  <Input
                    value={editedComponent.supplier || ''}
                    onChange={(e) => 
                      setEditedComponent({ ...editedComponent, supplier: e.target.value })
                    }
                    placeholder="Enter supplier name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={editedComponent.notes || ''}
                    onChange={(e) => 
                      setEditedComponent({ ...editedComponent, notes: e.target.value })
                    }
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </FormControl>
              </VStack>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSaveComponent}
                isLoading={saving}
                loadingText="Saving..."
                isDisabled={!editedComponent}
              >
                Save Changes
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
