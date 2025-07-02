import React from 'react';

import { Icon } from '@chakra-ui/react';
import {
  MdBarChart,
  MdPerson,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
  MdBuild,
  MdAutoGraph,
  MdDashboard,
  MdInventory,
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/default';
import NFTMarketplace from 'views/admin/marketplace';
import Profile from 'views/admin/profile';
import DataTables from 'views/admin/dataTables';
import RTL from 'views/admin/rtl';
import ComponentsPage from 'views/admin/components/ComponentsPage';
import Graph from 'views/admin/graph/graph';
import InventoryPage from 'views/admin/inventory/InventoryPage';
import GraphDagre from 'views/admin/graphDagre/index';

// Auth Imports
import SignInCentered from 'views/auth/signIn';

const routes = [
  {
    name: 'Main Dashboard',
    layout: '/admin',
    path: '/default',
    icon: (
      <Icon
        as={MdDashboard as any}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <MainDashboard />,
  },
  {
    name: 'Components',
    layout: '/admin',
    path: '/components',
    icon: (
      <Icon as={MdBuild as any} width="20px" height="20px" color="inherit" />
    ),
    component: <ComponentsPage />,
  },

  {
    name: 'Inventory',
    layout: '/admin',
    path: '/inventory',
    icon: (
      <Icon
        as={MdInventory as any}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <InventoryPage />,
  },
];

// Hidden routes (not shown in sidebar but accessible via navigation)
export const hiddenRoutes = [
  {
    name: 'Graph View',
    layout: '/admin',
    path: '/graph/:initialComponent',
    component: <GraphDagre />,
  },
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    component: <SignInCentered />,
  },
];

export default routes;
