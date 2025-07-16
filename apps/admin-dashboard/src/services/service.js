const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiService {
  static getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async handleResponse(response) {
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, clear auth data and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error((await response.text()) || response.statusText);
    }
    const data = await response.json();
    return data;
  }

  // Components endpoints
  static async getPrinters() {
    try {
      const headers = this.getAuthHeaders();
      console.log('getPrinters - Headers:', headers);
      console.log(
        'getPrinters - Token from localStorage:',
        localStorage.getItem('authToken'),
      );

      const response = await fetch(`${API_URL}/printers`, {
        headers,
      });
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Error fetching printers:', error);
      return [];
    }
  }

  static async getGroups() {
    try {
      const response = await fetch(`${API_URL}/groups`, {
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  static async getAssemblies() {
    try {
      const response = await fetch(`${API_URL}/assemblies`, {
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Error fetching assemblies:', error);
      return [];
    }
  }

  static async getTree(topName) {
    try {
      const response = await fetch(`${API_URL}/tree?topName=${topName}`, {
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse(response);
      return data || { tree: {} };
    } catch (error) {
      console.error('Error fetching tree:', error);
      return { tree: {} };
    }
  }

  static async getComponent(componentName) {
    const encodedComponentName = encodeURIComponent(componentName);
    const response = await fetch(
      `${API_URL}/component/${encodedComponentName}`,
      {
        headers: this.getAuthHeaders(),
      },
    );
    if (!response.ok) {
      throw new Error('Component not found');
    }
    return await response.json();
  }

  static async createComponent(componentData, rootComponent) {
    const response = await fetch(
      `${API_URL}/components?root=${encodeURIComponent(rootComponent)}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(componentData),
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create component');
    }
    return await response.json();
  }

  static async createPrinter(printerData, rootComponent) {
    const response = await fetch(
      `${API_URL}/components?root=${encodeURIComponent(rootComponent)}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...printerData,
          type: 'printer',
        }),
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create printer');
    }
    return await response.json();
  }

  static async createGroup(groupData, rootComponent) {
    const response = await fetch(
      `${API_URL}/components?root=${encodeURIComponent(rootComponent)}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...groupData,
          type: 'group',
        }),
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create group');
    }
    return await response.json();
  }

  static async createAssembly(assemblyData, rootComponent) {
    const response = await fetch(
      `${API_URL}/components?root=${encodeURIComponent(rootComponent)}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...assemblyData,
          type: 'assembly',
        }),
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create assembly');
    }
    return await response.json();
  }

  /**
   * Updates an existing component
   * @param {Object} component - The component to update
   * @returns {Promise<Object>} The updated component
   */
  static async updateComponent(component) {
    // Check if component name exists
    if (!component.componentName) {
      throw new Error('Component name is required for update');
    }

    const response = await fetch(
      `${API_URL}/components/${encodeURIComponent(component.componentName)}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          amount: component.amount,
          measure: component.measure,
          scannedBy: component.scannedBy,
          durationOfDevelopment: component.durationOfDevelopment,
          triggerMinAmount: component.triggerMinAmount,
          supplier: component.supplier,
          cost: component.cost,
          type: component.type,
          description: component.description,
          image: component.image,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update component');
    }

    return response.json();
  }

  static async deleteComponent(
    componentName,
    deleteOutOfDatabase,
    parent = null,
  ) {
    const params = new URLSearchParams({
      componentName,
      deleteOutOfDatabase: deleteOutOfDatabase.toString(),
    });

    if (parent) {
      params.append('parent', parent);
    }

    const response = await fetch(`${API_URL}/components?${params.toString()}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete component');
    }

    // Only return JSON if there's content (deleteOutOfDatabase=true)
    if (deleteOutOfDatabase) {
      return await response.json();
    }

    return { success: true };
  }

  // Relationships endpoints
  static async getRelationship(topComponent, subComponent) {
    const response = await fetch(
      `${API_URL}/relationships?topComponent=${encodeURIComponent(
        topComponent,
      )}&subComponent=${encodeURIComponent(subComponent)}`,
      {
        headers: this.getAuthHeaders(),
      },
    );
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `Relationship between '${topComponent}' and '${subComponent}' not found`,
        );
      }
      throw new Error('Failed to fetch relationship');
    }
    return await response.json();
  }

  static async createRelationship(relationshipData) {
    const response = await fetch(`${API_URL}/relationships`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(relationshipData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create relationship');
    }
    return await response.json();
  }

  static async updateRelationship(relationshipData) {
    const response = await fetch(`${API_URL}/relationships`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(relationshipData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update relationship');
    }
    return await response.json();
  }

  static async deleteRelationship(topComponent, subComponent) {
    const response = await fetch(
      `${API_URL}/relationships?topComponent=${encodeURIComponent(
        topComponent,
      )}&subComponent=${encodeURIComponent(subComponent)}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete relationship');
    }
    return await response.json();
  }

  static async getAllComponents() {
    try {
      const headers = this.getAuthHeaders();
      console.log('getAllComponents - Headers:', headers);
      console.log(
        'getAllComponents - Token from localStorage:',
        localStorage.getItem('authToken'),
      );

      const response = await fetch(`${API_URL}/all_components`, {
        headers,
      });
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Error fetching all components:', error);
      return [];
    }
  }

  static async getAllComponentsLight() {
    try {
      const headers = this.getAuthHeaders();
      console.log('getAllComponentsLight - Fetching lightweight components');

      const response = await fetch(`${API_URL}/all_components_light`, {
        headers,
      });
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Error fetching lightweight components:', error);
      return [];
    }
  }

  static async getAllComponentsLightPaginated(page = 1, pageSize = 50) {
    try {
      const headers = this.getAuthHeaders();
      console.log(`getAllComponentsLightPaginated - Fetching page ${page} with ${pageSize} items`);

      const response = await fetch(`${API_URL}/all_components_light_paginated?page=${page}&page_size=${pageSize}`, {
        headers,
      });
      const data = await this.handleResponse(response);
      return data || { data: [], pagination: {} };
    } catch (error) {
      console.error('Error fetching paginated lightweight components:', error);
      return { data: [], pagination: {} };
    }
  }

  static async getGraph(topName) {
    try {
      const headers = this.getAuthHeaders();

      const response = await fetch(
        `${API_URL}/graph?topName=${encodeURIComponent(topName)}`,
        {
          headers,
        },
      );
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Error fetching all components:', error);
      return [];
    }
  }

  // Fuzzy search functionality for existing components
  static async fuzzySearchComponents(query) {
    try {
      // Get all components from the existing endpoint
      const response = await fetch(`${API_URL}/all_components`, {
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse(response);
      const allComponents = data || [];

      // Implement client-side fuzzy search
      if (!query || query.length < 2) {
        return [];
      }

      const queryLower = query.toLowerCase();

      // Simple fuzzy search algorithm
      const matches = allComponents.filter((component) => {
        const componentName =
          component.componentName || component.name || component;
        const nameLower = componentName.toLowerCase();

        // Exact match gets highest priority
        if (nameLower === queryLower) return true;

        // Starts with query
        if (nameLower.startsWith(queryLower)) return true;

        // Contains query
        if (nameLower.includes(queryLower)) return true;

        // Fuzzy match - check if all characters of query exist in order
        let queryIndex = 0;
        for (
          let i = 0;
          i < nameLower.length && queryIndex < queryLower.length;
          i++
        ) {
          if (nameLower[i] === queryLower[queryIndex]) {
            queryIndex++;
          }
        }
        return queryIndex === queryLower.length;
      });

      // Sort matches by relevance
      const sortedMatches = matches.sort((a, b) => {
        const aName = (a.componentName || a.name || a).toLowerCase();
        const bName = (b.componentName || b.name || b).toLowerCase();

        // Exact matches first
        if (aName === queryLower && bName !== queryLower) return -1;
        if (bName === queryLower && aName !== queryLower) return 1;

        // Starts with query
        if (aName.startsWith(queryLower) && !bName.startsWith(queryLower))
          return -1;
        if (bName.startsWith(queryLower) && !aName.startsWith(queryLower))
          return 1;

        // Contains query
        const aContains = aName.includes(queryLower);
        const bContains = bName.includes(queryLower);
        if (aContains && !bContains) return -1;
        if (bContains && !aContains) return 1;

        // Alphabetical order
        return aName.localeCompare(bName);
      });

      // Return only component names, limit to 10 results
      return sortedMatches
        .slice(0, 10)
        .map(
          (component) => component.componentName || component.name || component,
        );
    } catch (error) {
      console.error('Error performing fuzzy search:', error);
      return [];
    }
  }

  // Method to preview deletion impact (simulated based on tree analysis)
  static async previewDeletionImpact(componentName, rootComponent) {
    try {
      // Get the tree to analyze impact
      const treeResponse = await this.getTree(rootComponent);
      const treeData = treeResponse.tree;

      // Find all components that depend on this component
      const dependentComponents = [];

      // Check if the component has any children
      const hasChildren =
        treeData[componentName] && treeData[componentName].length > 0;
      const childrenCount = hasChildren ? treeData[componentName].length : 0;

      // Find all components that use this component as a subcomponent
      for (const [parent, children] of Object.entries(treeData)) {
        if (children && children.some(([child]) => child === componentName)) {
          dependentComponents.push(parent);
        }
      }

      return {
        componentName,
        canDelete: true, // Assuming all components can be deleted for now
        dependentComponents,
        childrenCount,
        hasChildren,
        impact: dependentComponents.length > 0 || hasChildren ? 'high' : 'low',
        message:
          dependentComponents.length > 0
            ? `This component is used by ${
                dependentComponents.length
              } other component(s): ${dependentComponents.join(', ')}`
            : hasChildren
            ? `This component has ${childrenCount} child component(s)`
            : 'This component can be safely deleted',
      };
    } catch (error) {
      console.error('Error previewing deletion impact:', error);
      return {
        componentName,
        canDelete: false,
        dependentComponents: [],
        childrenCount: 0,
        hasChildren: false,
        impact: 'unknown',
        message: 'Could not analyze deletion impact',
      };
    }
  }
}
