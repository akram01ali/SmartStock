import React, { useCallback, useEffect, useState } from 'react';
import {
  Background,
  ReactFlow,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  NodeToolbar,
  NodeResizer,
  Connection,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { Button, useToast, Box } from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '../common/IconWrapper';
import '@xyflow/react/dist/style.css';
import { ComponentDialog } from './componentDialog';
import { DeleteConfirmationDialog } from './deleteConfirmationDialog';
import { ApiService } from '../../services/service';
import { useParams } from 'react-router-dom';
import { RelationshipDialog } from './relationshipDialog';
import {
  GraphNode,
  GraphEdge,
  ApiError,
  ComponentCreate,
} from './types';

const styles = {
  flowWrapper: {
    width: '100%',
    height: '80vh',
    border: '1px solid #eee',
    borderRadius: '5px',
  },
  panelContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: '16px 24px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    fontSize: '18px',
    fontWeight: '700',
    color: '#2d3748',
    border: '2px solid rgba(67, 24, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  buttonContainer: {
    display: 'flex',
    gap: '8px',
  },
  componentName: {
    color: '#4318FF',
  },
};

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (
  nodes: Array<GraphNode>,
  edges: Array<GraphEdge>,
  direction: 'TB' | 'LR' = 'TB',
) => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

// Custom Edge Label Component
function CustomEdgeLabel({ id, sourceX, sourceY, targetX, targetY, label }: any) {
  // Determine layout direction based on the relative positions
  const isVertical = Math.abs(targetY - sourceY) > Math.abs(targetX - sourceX);
  
  let labelX, labelY;
  
  if (isVertical) {
    // Vertical layout: place label directly above the target node
    labelX = targetX;
    labelY = targetY - 25; // 25px above the target node
  } else {
    // Horizontal layout: place label directly to the left of the target node
    labelX = targetX - 35; // 35px to the left of the target node
    labelY = targetY;
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all',
        zIndex: 1000,
      }}
      className="react-flow__edge-label"
    >
      <Box
        bg="white"
        px={2}
        py={1}
        borderRadius="md"
        border="1px solid #ddd"
        fontSize="xs"
        fontWeight="bold"
        color="#4318FF"
        boxShadow="0 2px 4px rgba(0,0,0,0.1)"
        _hover={{
          bg: '#f7fafc',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        }}
        transition="all 0.2s"
      >
        {label}
      </Box>
    </div>
  );
}

// Custom Edge Component
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, markerEnd, label }: any) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <CustomEdgeLabel
            id={id}
            sourceX={sourceX}
            sourceY={sourceY}
            targetX={targetX}
            targetY={targetY}
            label={label}
          />
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Edge types configuration
const edgeTypes = {
  'smoothstep': CustomEdge,
};

const Flow = () => {
  const { initialComponent } = useParams<{ initialComponent: string }>();
  const toast = useToast();

  // State declarations
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [relationshipDialog, setRelationshipDialog] = useState({
    isOpen: false,
    sourceComponent: '',
    targetComponent: '',
    currentAmount: 1.0,
  });

  // Graph loading and updates
  const loadGraph = async () => {
    try {
      setIsLoading(true);
      const graphData = await ApiService.getGraph(initialComponent) as { nodes: any[], edges: any[] };
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(graphData.nodes, graphData.edges, 'TB');
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error) {
      console.error('Error loading graph:', error);
      toast({
        title: 'Error loading graph',
        description: error instanceof Error ? error.message : 'Failed to load component graph. Please try again.',
        status: 'error',
        duration: 5000,
      });
      // Set empty state on error
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [initialComponent]);

  // Callbacks
  const onSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) => {
      setSelectedElements([...nodes, ...edges]);
      setSelectedNode(nodes[0] || null);
      setSelectedEdge(edges[0] || null);
    },
    [],
  );

  const onConnect = useCallback(
    async (params: Connection) => {
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

        setRelationshipDialog({
          isOpen: true,
          sourceComponent,
          targetComponent,
          currentAmount: 1.0,
        });
      } catch (error) {
        console.error('Error handling connection:', error);
        toast({
          title: 'Error creating relationship',
          description: error instanceof Error ? error.message : 'Failed to create relationship',
          status: 'error',
          duration: 5000,
        });
      }
    },
    [nodes, toast],
  );

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges],
  );

  const handleNodeDoubleClick = useCallback(
    async (_event: React.MouseEvent, node: GraphNode) => {
      try {
        const componentData = await ApiService.getComponent(node.data.label);
        setSelectedComponent(componentData);
        setIsDialogOpen(true);
      } catch (error) {
        console.error('Error fetching component details:', error);
        toast({
          title: 'Error fetching component',
          description: error instanceof Error ? error.message : 'Failed to load component details',
          status: 'error',
          duration: 3000,
        });
      }
    },
    [toast],
  );

  const handleEdgeDoubleClick = useCallback(
    async (_event: React.MouseEvent, edge: GraphEdge) => {
      try {
        const sourceComponent = edge.source;
        const targetComponent = edge.target;
        const currentAmount = edge.label;

        setRelationshipDialog({
          isOpen: true,
          sourceComponent,
          targetComponent,
          currentAmount: currentAmount,
        });
      } catch (error) {
        console.error('Error handling edge double click:', error);
        toast({
          title: 'Error opening relationship editor',
          description: error instanceof Error ? error.message : 'Failed to open relationship editor',
          status: 'error',
          duration: 3000,
        });
      }
    },
    [toast],
  );

  // CRUD Operations
  const handleCreateComponent = async (
    componentData: ComponentCreate,
    relationshipData?: { amount: number },
  ) => {
    try {
      await ApiService.createComponent(componentData, initialComponent);

      await loadGraph();

      toast({
        title: 'Component created',
        description: `Component ${componentData.componentName} has been created`,
        status: 'success',
        duration: 4000,
      });
    } catch (error) {
      console.error('Error creating component:', error);
      toast({
        title: 'Error creating component',
        description: error instanceof Error ? error.message : 'Failed to create component',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleUpdateComponent = async (componentData: ComponentCreate) => {
    try {
      await ApiService.updateComponent(componentData);
      await loadGraph();
      toast({
        title: 'Component updated',
        description: `Component ${componentData.componentName} has been updated`,
        status: 'success',
        duration: 4000,
      });
    } catch (error) {
      console.error('Error updating component:', error);
      toast({
        title: 'Error updating component',
        description: error instanceof Error ? error.message : 'Failed to update component',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDelete = async () => {
    if (selectedEdge) {
      try {
        const sourceComponent = selectedEdge.source;
        const targetComponent = selectedEdge.target;

        await ApiService.deleteRelationship(sourceComponent, targetComponent);

        loadGraph();
        setSelectedEdge(null);

        toast({
          title: 'Relationship deleted',
          description: `Relationship between ${sourceComponent} and ${targetComponent} has been removed`,
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Error deleting relationship:', error);
        toast({
          title: 'Error deleting relationship',
          description: error instanceof Error ? error.message : 'Failed to delete relationship',
          status: 'error',
          duration: 5000,
        });
      }
    } else if (selectedNode) {
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteNode = async (fromDatabase: boolean) => {
    try {
      const componentName = selectedNode.data.label;
      // Make
      const path_array = selectedNode.id.split('/');
      const parent = path_array[path_array.length - 2];

      await ApiService.deleteComponent(componentName, fromDatabase, parent);
      setSelectedNode(null);
      await loadGraph();

      toast({
        title: fromDatabase ? 'Component deleted' : 'Component removed',
        description: `Component ${componentName} has been ${
          fromDatabase ? 'deleted from database' : 'removed from subassembly'
        }`,
        status: 'success',
        duration: 4000,
      });
    } catch (error) {
      console.error('Error deleting component:', error);
      toast({
        title: `Error ${fromDatabase ? 'deleting' : 'removing'} component`,
        description: error instanceof Error ? error.message : 'Failed to delete component',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleRelationshipSubmit = async (amount: number) => {
    const { sourceComponent, targetComponent } = relationshipDialog;

    try {
      await ApiService.createRelationship({
        topComponent: sourceComponent,
        subComponent: targetComponent,
        root: initialComponent,
        amount: amount,
      });

      // Now update the edge in the graph
      loadGraph();

      toast({
        title: 'Relationship updated',
        description: `Connected ${sourceComponent} to ${targetComponent}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error creating relationship:', error);
      toast({
        title: 'Error creating relationship',
        description: error instanceof Error ? error.message : 'Failed to create relationship',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (isLoading) {
    return <div>Loading graph...</div>;
  }

  return (
    <div style={styles.flowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        onSelectionChange={onSelectionChange}
        multiSelectionKeyCode="Control"
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Panel position="top-left">
          <div style={styles.panelContainer}>
            📊 Component Hierarchy:{' '}
            <span style={styles.componentName}>{initialComponent}</span>
          </div>
        </Panel>
        <Panel position="top-right">
          <div style={styles.buttonContainer}>
            <Button onClick={() => onLayout('TB')} colorScheme="green">
              Vertical Layout
            </Button>
            <Button onClick={() => onLayout('LR')} colorScheme="orange">
              Horizontal Layout
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              colorScheme="blue"
              leftIcon={<AddIcon size="16px" />}
            >
              Add Node
            </Button>
            {(selectedNode || selectedEdge) && (
              <Button
                onClick={handleDelete}
                colorScheme="red"
                leftIcon={<DeleteIcon size="16px" />}
              >
                Delete {selectedNode ? 'Component' : 'Relationship'}
              </Button>
            )}
          </div>
        </Panel>
        <NodeToolbar />
        <NodeResizer />
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>

      <ComponentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        component={selectedComponent}
        mode="edit"
        onSubmit={handleUpdateComponent}
      />
      <ComponentDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        component={null}
        mode="create"
        initialComponent={initialComponent}
        onSubmit={handleCreateComponent}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        componentName={selectedNode?.data.label || ''}
        parentComponent={initialComponent}
        onDeleteFromDatabase={() => handleDeleteNode(true)}
        onDeleteFromSubassembly={() => handleDeleteNode(false)}
      />
      <RelationshipDialog
        isOpen={relationshipDialog.isOpen}
        onClose={() =>
          setRelationshipDialog((prev) => ({ ...prev, isOpen: false }))
        }
        sourceComponent={relationshipDialog.sourceComponent}
        targetComponent={relationshipDialog.targetComponent}
        initialAmount={relationshipDialog.currentAmount}
        onSubmit={handleRelationshipSubmit}
      />
    </div>
  );
};

export function Shit() {
  return <Flow />;
}
