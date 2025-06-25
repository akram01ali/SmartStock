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
import { ApiService } from '../../services/service';
import { ComponentDialog } from './componentDialog';
import { Button, Icon, useToast } from '@chakra-ui/react';
import { MdAdd, MdDelete } from 'react-icons/md';
import '@xyflow/react/dist/style.css';
import { RelationshipDialog } from './relationshipDialog';

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

const calculateNodePositions = (treeData, rootComponent) => {
  const positions = new Map();
  const levels = new Map();
  const visited = new Set();

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

  const nodesByLevel = new Map();
  for (const [nodeName, level] of levels.entries()) {
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level).push(nodeName);
  }

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
  const toast = useToast(); // Add this line at the top of your component
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);

  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const handleEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const handleDelete = async () => {
    try {
      if (selectedNode) {
        const componentName = selectedNode.data.label;
        await ApiService.deleteComponent(componentName);
        setSelectedNode(null);
        toast({
          title: 'Component deleted',
          description: `${componentName} has been deleted`,
          status: 'success',
          duration: 3000,
        });
      } else if (selectedEdge) {
        // Extract component names from edge ID (edge-sourceComponent-targetComponent)
        const [, sourceComponent, targetComponent] = selectedEdge.id.split('-');
        await ApiService.deleteRelationship(sourceComponent, targetComponent);
        setSelectedEdge(null);
        toast({
          title: 'Relationship deleted',
          description: 'Relationship has been removed',
          status: 'success',
          duration: 3000,
        });
      }
      await fetchTreeData();
    } catch (error) {
      toast({
        title: 'Error deleting',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const fetchTreeData = useCallback(async () => {
    if (!initialComponent) return;

    try {
      setLoading(true);
      const response = await ApiService.getTree(initialComponent);
      const treeData = response.tree;

      const { positions, levels } = calculateNodePositions(
        treeData,
        initialComponent,
      );

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
          data: { label: nodeName },
          style: {
            background: `linear-gradient(135deg, ${nodeColor} 0%, ${nodeColor}dd 100%)`,
            color: 'white',
            border: isRoot
              ? '3px solid #FFD700'
              : '2px solid rgba(255,255,255,0.3)',
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
          },
          className: 'custom-node',
        };

        newNodes.push(newNode);
      }

      const newEdges = [];
      Object.keys(treeData).forEach((parentName) => {
        const parentNodeId = nodePositions.get(parentName);
        if (parentNodeId && treeData[parentName]) {
          treeData[parentName].forEach(([childName, amount]) => {
            // Only create edges for non-zero amounts
            if (amount > 0) {
              const childNodeId = nodePositions.get(childName);
              if (childNodeId) {
                const parentLevel = levels.get(parentName) || 0;
                const edgeColor = getNodeColor(parentLevel);

                newEdges.push({
                  id: `edge-${parentName}-${childName}`,
                  source: parentNodeId,
                  target: childNodeId,
                  label: `${amount}`,
                  type: 'step',
                  animated: true,
                  style: {
                    stroke: edgeColor,
                    strokeWidth: 1,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  },
                  labelStyle: {
                    fill: edgeColor,
                    fontWeight: '700',
                    fontSize: '13px',
                  },
                });
              }
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
  }, [initialComponent, setNodes, setEdges]);

  const handleCreateComponent = async (componentData, relationshipData) => {
    try {
      // First create the component
      await ApiService.createComponent(componentData);

      // Then create a relationship with the root component
      await ApiService.createRelationship({
        topComponent: initialComponent,
        subComponent: componentData.componentName,
        amount: 0,
      });

      // Finally refresh the tree to show the new component
      await fetchTreeData();
    } catch (error) {
      console.error('Error handling component creation:', error);
    }
  };

  const handleNodeDoubleClick = useCallback(async (event, node) => {
    try {
      const componentName = node.data.label;
      const componentData = await ApiService.getComponent(componentName);
      setSelectedComponent(componentData);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching component details:', error);
    }
  }, []);

  const [relationshipDialog, setRelationshipDialog] = useState({
    isOpen: false,
    sourceComponent: '',
    targetComponent: '',
  });

  const onConnect = useCallback(
    async (params) => {
      try {
        const sourceNode = nodes.find((node) => node.id === params.source);
        const targetNode = nodes.find((node) => node.id === params.target);

        if (!sourceNode || !targetNode) return;

        const sourceComponent = sourceNode.data.label;
        const targetComponent = targetNode.data.label;

        // Open dialog to specify amount
        setRelationshipDialog({
          isOpen: true,
          sourceComponent,
          targetComponent,
        });
      } catch (error) {
        console.error('Error handling connection:', error);
        toast({
          title: 'Error creating relationship',
          description: error.message,
          status: 'error',
          duration: 5000,
        });
      }
    },
    [nodes, toast],
  );

  const handleRelationshipSubmit = async (amount: number) => {
    const { sourceComponent, targetComponent } = relationshipDialog;

    try {
      // Check if relationship exists
      try {
        await ApiService.getRelationship(sourceComponent, targetComponent);
        // If we get here, relationship exists - update it
        await ApiService.updateRelationship(
          sourceComponent,
          targetComponent,
          amount,
        );
      } catch (error) {
        // If relationship not found, create new one
        if (error.message.includes('not found')) {
          await ApiService.createRelationship({
            topComponent: sourceComponent,
            subComponent: targetComponent,
            amount,
          });
        } else {
          throw error;
        }
      }

      await fetchTreeData();
      toast({
        title: 'Relationship updated',
        description: `Connected ${sourceComponent} to ${targetComponent}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error creating relationship',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
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
    fetchTreeData();
  }, [fetchTreeData]);

  const flowStyles = {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    width: '100%',
    height: `${dimensions.height * 0.85}px`,
    position: 'relative',
  };

  if (loading) {
    return (
      <div style={flowStyles}>
        <div
          style={{
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
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #4318FF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            ></div>
            Loading component tree for "{initialComponent}"...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={flowStyles}>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .custom-node:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 48px rgba(67, 24, 255, 0.4) !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
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
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
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
            },
          }}
        />
        <Background
          variant="dots"
          gap={20}
          size={1.5}
          color="rgba(67, 24, 255, 0.15)"
        />
        <Panel position="top-left">
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              padding: '16px 24px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              fontSize: '18px',
              fontWeight: '700',
              color: '#2d3748',
              border: '2px solid rgba(67, 24, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            📊 Component Hierarchy:{' '}
            <span style={{ color: '#4318FF' }}>{initialComponent}</span>
          </div>
        </Panel>
        <Panel position="top-right">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              colorScheme="blue"
              leftIcon={<Icon as={MdAdd} />}
              className="add-button"
            >
              Add Component
            </Button>
          </div>
        </Panel>
      </ReactFlow>
      <ComponentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        component={selectedComponent}
        mode="edit"
        onSubmit={handleCreateComponent}
      />
      <ComponentDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        component={null}
        mode="create"
        onSubmit={handleCreateComponent}
      />
      <RelationshipDialog
        isOpen={relationshipDialog.isOpen}
        onClose={() =>
          setRelationshipDialog((prev) => ({ ...prev, isOpen: false }))
        }
        sourceComponent={relationshipDialog.sourceComponent}
        targetComponent={relationshipDialog.targetComponent}
        onSubmit={handleRelationshipSubmit}
      />
    </div>
  );
}
