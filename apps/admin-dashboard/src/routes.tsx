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
  MdAnalytics,
  MdChecklist,
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
import ForecastingPage from 'views/admin/forecasting/ForecastingPage';
import TemplateManager from 'views/admin/checklists/TemplateManager';
import ControlChecklistExecution from 'views/admin/checklists/ControlChecklistExecution';

// Auth Imports
import SignInCentered from 'views/auth/signIn';

const routes = [
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
  {
    name: 'Forecasting',
    layout: '/admin',
    path: '/forecasting',
    icon: (
      <Icon
        as={MdAnalytics as any}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <ForecastingPage />,
  },
  {
    name: 'Control Checklists',
    layout: '/admin',
    path: '/control-checklists',
    icon: (
      <Icon
        as={MdChecklist as any}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <ControlChecklistExecution />,
  },
];

// Hidden routes (not shown in sidebar but accessible via navigation)
export const hiddenRoutes = [
  {
    name: 'Main Dashboard',
    layout: '/admin',
    path: '/default',
    component: <MainDashboard />,
  },
  {
    name: 'Graph View',
    layout: '/admin',
    path: '/graph/:initialComponent',
    component: <GraphDagre />,
  },
  {
    name: 'Template Manager',
    layout: '/admin',
    path: '/checklist-templates',
    component: <TemplateManager />,
  },
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    component: <SignInCentered />,
  },
];

export default routes;
