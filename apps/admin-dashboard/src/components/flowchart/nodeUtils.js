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

const calculateNodePositions = (treeResponse, rootComponent) => {
  const positions = new Map();
  const levels = new Map();
  const flatTree = new Map();
  const allNodeInstances = [];
  
  // Recursively traverse the tree to collect all node instances
  const traverseNode = (node, level, parentPath = '') => {
    const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const nodeInstance = {
      path: nodePath,
      name: node.name,
      level: level,
      children: []
    };
    
    allNodeInstances.push(nodeInstance);
    levels.set(nodePath, level);
    
    // Process children
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        // The child path should match what gets created when we traverse the child
        const childPath = `${nodePath}/child_${index}/${child.name}`;
        nodeInstance.children.push([childPath, child.name, child.amount]);
        traverseNode(child, level + 1, `${nodePath}/child_${index}`);
      });
    }
    
    flatTree.set(nodePath, nodeInstance.children);
  };
  
  // Process all root-level nodes
  if (treeResponse.nodes && treeResponse.nodes.length > 0) {
    treeResponse.nodes.forEach((node, index) => {
      const rootPath = `root_${index}_${node.name}`;
      traverseNode(node, 0, `root_${index}`);
    });
  }
  
  // Group nodes by level for positioning
  const nodesByLevel = new Map();
  allNodeInstances.forEach(instance => {
    const level = instance.level;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level).push(instance.path);
  });

  const nodeWidth = 160;
  const nodeHeight = 80;
  const levelHeight = 200;
  const minNodeSpacing = 40;

  for (const [level, nodePaths] of nodesByLevel.entries()) {
    const nodeCount = nodePaths.length;
    const totalWidth = nodeCount * nodeWidth + (nodeCount - 1) * minNodeSpacing;
    const startX = -totalWidth / 2;

    nodePaths.forEach((nodePath, index) => {
      const x = startX + index * (nodeWidth + minNodeSpacing) + nodeWidth / 2;
      const y = level * levelHeight;
      positions.set(nodePath, { x, y });
    });
  }

  return { positions, levels, flatTree, allNodeInstances };
};

export { getNodeColor, calculateNodePositions };