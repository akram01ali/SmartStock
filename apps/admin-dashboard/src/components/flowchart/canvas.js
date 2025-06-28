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
import { DeleteConfirmationDialog } from './deleteConfirmationDialog';
import { Button, Icon, useToast } from '@chakra-ui/react';
import { MdAdd, MdDelete } from 'react-icons/md';
import '@xyflow/react/dist/style.css';
import { RelationshipDialog } from './relationshipDialog';
import { getNodeColor, calculateNodePositions } from './nodeUtils';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [levels, setLevels] = useState(new Map());

  const handleNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
      setSelectedEdge(null);

      // Update node selection visually
      setNodes((nodes) =>
        nodes.map((n) => ({
          ...n,
          selected: n.id === node.id,
          style: {
            ...n.style,
            border:
              n.id === node.id
                ? '3px solid #FFD700'
                : n.data.label === initialComponent
                ? '3px solid #FFD700'
                : '2px solid rgba(255,255,255,0.3)',
            boxShadow:
              n.id === node.id
                ? '0 0 20px rgba(255, 215, 0, 0.6)'
                : n.style.boxShadow,
          },
        })),
      );
    },
    [setNodes, initialComponent],
  );

  const handleEdgeClick = useCallback(
    (event, edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);

      // Update edge selection visually
      setEdges((edges) =>
        edges.map((e) => ({
          ...e,
          selected: e.id === edge.id,
          style: {
            ...e.style,
            strokeWidth: e.id === edge.id ? 3 : 1,
            stroke: e.id === edge.id ? '#FFD700' : e.style.stroke,
          },
        })),
      );
    },
    [setEdges],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);

    // Reset all node styles to unselected
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        selected: false,
        style: {
          ...n.style,
          border:
            n.data.label === initialComponent
              ? '3px solid #FFD700'
              : '2px solid rgba(255,255,255,0.3)',
          boxShadow: n.style.boxShadow.includes('rgba(255, 215, 0')
            ? `0 8px 32px rgba(67, 24, 255, ${
                0.3 - (levels.get(n.data.label) || 0) * 0.05
              })`
            : n.style.boxShadow,
        },
      })),
    );

    // Reset all edge styles to unselected
    setEdges((edges) =>
      edges.map((e) => ({
        ...e,
        selected: false,
        style: {
          ...e.style,
          strokeWidth: 1,
          stroke:
            e.style.stroke === '#FFD700'
              ? getNodeColor(0) // Default to level 0 color if we can't determine the level
              : e.style.stroke,
        },
      })),
    );
  }, [setNodes, setEdges, initialComponent, levels]);

  const handleDelete = async () => {
    // This function is now only called to open the delete dialog
    // The actual deletion logic is handled by the specific delete methods below
    if (selectedNode || selectedEdge) {
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteFromDatabase = async () => {
    try {
      if (selectedNode) {
        const componentName = selectedNode.data.label;
        
        // Use the new delete method that completely removes from database
        const result = await ApiService.deleteComponent(componentName, true);
        setSelectedNode(null);
        toast({
          title: 'Component deleted from database',
          description: `Component ${componentName} has been completely removed from the database`,
          status: 'success',
          duration: 4000,
        });
      } else if (selectedEdge) {
        // Extract component names from edge ID (edge-sourceComponent-targetComponent)
        const [, sourceComponent, targetComponent] = selectedEdge.id.split('-');

        // Check if this is an edge from the root node
        if (sourceComponent === initialComponent) {
          // Update the relationship to amount 0 instead of deleting
          await ApiService.updateRelationship({
            topComponent: sourceComponent,
            subComponent: targetComponent,
            root: initialComponent,
            amount: 0,
          });
          setSelectedEdge(null);
          toast({
            title: 'Relationship updated',
            description: 'Relationship amount set to 0',
            status: 'success',
            duration: 3000,
          });
        } else {
          // For non-root edges, delete as normal
          await ApiService.deleteRelationship(sourceComponent, targetComponent, initialComponent);
          setSelectedEdge(null);
          toast({
            title: 'Relationship deleted',
            description: 'Relationship has been removed',
            status: 'success',
            duration: 3000,
          });
        }
      }
      await fetchTreeData();
    } catch (error) {
      toast({
        title: 'Error deleting from database',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeleteFromSubassembly = async () => {
    try {
      if (selectedNode) {
        const componentName = selectedNode.data.label;
        
        // Don't allow deleting the root component from its own subassembly
        if (componentName === initialComponent) {
          toast({
            title: 'Cannot remove root component',
            description: 'You cannot remove the root component from its own subassembly',
            status: 'warning',
            duration: 3000,
          });
          return;
        }

        // Find the parent of the selected component by looking at the tree data
        const treeResponse = await ApiService.getTree(initialComponent);
        const treeData = treeResponse.tree;
        
        let parentComponent = null;
        // Look through the tree to find which component points to this one
        for (const [parent, children] of Object.entries(treeData)) {
          if (children && children.some(([child]) => child === componentName)) {
            parentComponent = parent;
            break;
          }
        }

        if (!parentComponent) {
          toast({
            title: 'Error',
            description: 'Could not find parent component',
            status: 'error',
            duration: 3000,
          });
          return;
        }

        const result = await ApiService.removeComponentFromSubassembly(
          componentName, 
          initialComponent, 
          parentComponent
        );
        setSelectedNode(null);
        toast({
          title: 'Component removed from subassembly',
          description: `Component ${componentName} has been removed from the subassembly`,
          status: 'success',
          duration: 4000,
        });
      } else if (selectedEdge) {
        // For edges, just delete the specific relationship
        const [, sourceComponent, targetComponent] = selectedEdge.id.split('-');
        await ApiService.deleteRelationship(sourceComponent, targetComponent, initialComponent);
        setSelectedEdge(null);
        toast({
          title: 'Relationship removed',
          description: 'Relationship has been removed from this subassembly',
          status: 'success',
          duration: 3000,
        });
      }
      await fetchTreeData();
    } catch (error) {
      toast({
        title: 'Error removing from subassembly',
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
      // Note: response now has structure { root: "name", nodes: [...] }

      const { positions, levels: calculatedLevels, flatTree, allNodeInstances } = calculateNodePositions(
        response,
        initialComponent,
      );

      setLevels(calculatedLevels);

      const newNodes = [];
      const nodePositions = new Map();
      let nodeId = 0;

      // Create visual nodes for each node instance
      allNodeInstances.forEach(instance => {
        const level = instance.level;
        const currentNodeId = `node-${nodeId++}`;
        nodePositions.set(instance.path, currentNodeId);

        const nodeColor = getNodeColor(level);
        const isRoot = instance.name === initialComponent && level === 0;
        const position = positions.get(instance.path);

        const newNode = {
          id: currentNodeId,
          position,
          data: { label: instance.name },
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
          selected: false,
        };

        newNodes.push(newNode);
      });

      const newEdges = [];
      for (const [parentPath, children] of flatTree.entries()) {
        const parentNodeId = nodePositions.get(parentPath);
        if (parentNodeId && children && children.length > 0) {
          children.forEach(([childPath, childName, amount]) => {
            // Only create edges for non-zero amounts
            if (amount > 0) {
              const childNodeId = nodePositions.get(childPath);
              if (childNodeId) {
                const parentLevel = calculatedLevels.get(parentPath) || 0;
                const edgeColor = getNodeColor(parentLevel);

                newEdges.push({
                  id: `edge-${parentPath}-${childPath}`,
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
      }

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
      // Create the component with the root parameter - relationship is created automatically
      await ApiService.createComponent(componentData, initialComponent);

      // Refresh the tree to show the new component
      await fetchTreeData();
      
      toast({
        title: 'Component created',
        description: `Component ${componentData.componentName} has been created and added to ${initialComponent}`,
        status: 'success',
        duration: 4000,
      });
    } catch (error) {
      console.error('Error handling component creation:', error);
      toast({
        title: 'Error creating component',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
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

        // Prevent self-loops
        if (sourceComponent === targetComponent) {
          toast({
            title: 'Connection not allowed',
            description: 'A component cannot be connected to itself.',
            status: 'warning',
            duration: 3000,
          });
          return;
        }

        // TODO: Add cycle detection to prevent circular dependencies
        // This should ideally be done on the backend

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

  const handleRelationshipSubmit = async (amount) => {
    const { sourceComponent, targetComponent } = relationshipDialog;

    try {
      // Check if relationship exists
      try {
        await ApiService.getRelationship(sourceComponent, targetComponent, initialComponent);
        // If we get here, relationship exists - update it
        await ApiService.updateRelationship({
          topComponent: sourceComponent,
          subComponent: targetComponent,
          root: initialComponent,
          amount: parseInt(amount),
        });
      } catch (error) {
        // If relationship not found, create new one
        if (error.message.includes('not found')) {
          await ApiService.createRelationship({
            topComponent: sourceComponent,
            subComponent: targetComponent,
            root: initialComponent,
            amount: parseInt(amount),
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
        onPaneClick={handlePaneClick}
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
            {(selectedNode || selectedEdge) && (
              <Button
                onClick={handleDelete}
                colorScheme="red"
                leftIcon={<Icon as={MdDelete} />}
                className="delete-button"
              >
                Delete {selectedNode ? 'Component' : 'Relationship'}
              </Button>
            )}
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
        initialComponent={initialComponent}
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
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        componentName={selectedNode ? selectedNode.data.label : (selectedEdge ? selectedEdge.id.split('-')[2] : '')}
        parentComponent={initialComponent}
        onDeleteFromDatabase={handleDeleteFromDatabase}
        onDeleteFromSubassembly={handleDeleteFromSubassembly}
      />
    </div>
  );
}
