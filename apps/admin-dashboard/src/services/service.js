const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export class ApiService {
  static async handleResponse(response) {
    if (!response.ok) {
      throw new Error((await response.text()) || response.statusText);
    }
    const data = await response.json();
    return data;
  }

  // Components endpoints
  static async getPrinters() {
    try {
      const response = await fetch(`${API_URL}/printers`);
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Error fetching printers:', error);
      return [];
    }
  }

  static async getGroups() {
    try {
      const response = await fetch(`${API_URL}/groups`);
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  static async getTree(topName) {
    try {
      const response = await fetch(`${API_URL}/tree?topName=${topName}`);
      const data = await this.handleResponse(response);
      return data || { tree: {} };
    } catch (error) {
      console.error('Error fetching tree:', error);
      return { tree: {} };
    }
  }

  static async getComponent(componentName) {
    const response = await fetch(
      `${API_URL}/components?componentName=${componentName}`,
    );
    if (!response.ok) {
      throw new Error('Component not found');
    }
    return await response.json();
  }

  static async createComponent(componentData, rootComponent) {
    const response = await fetch(`${API_URL}/components?root=${encodeURIComponent(rootComponent)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create component');
    }
    return await response.json();
  }

  static async createPrinter(printerData, rootComponent) {
    const response = await fetch(`${API_URL}/components?root=${encodeURIComponent(rootComponent)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...printerData,
        type: 'printer'
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create printer');
    }
    return await response.json();
  }

  static async createGroup(groupData, rootComponent) {
    const response = await fetch(`${API_URL}/components?root=${encodeURIComponent(rootComponent)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...groupData,
        type: 'group'
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create group');
    }
    return await response.json();
  }

  static async updateComponent(componentName, updateData) {
    const response = await fetch(`${API_URL}/components/${componentName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error('Failed to update component');
    }
    return await response.json();
  }

  static async deleteComponent(componentName, deleteOutOfDatabase, root = null, parent = null) {
    const params = new URLSearchParams({
      componentName,
      deleteOutOfDatabase: deleteOutOfDatabase.toString()
    });
    
    if (root) {
      params.append('root', root);
    }
    
    if (parent) {
      params.append('parent', parent);
    }

    const response = await fetch(`${API_URL}/components?${params.toString()}`, {
      method: 'DELETE',
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(relationshipData),
    });
    if (!response.ok) {
      throw new Error('Failed to create relationship');
    }
    return await response.json();
  }

  static async updateRelationship(topComponent, subComponent, amount) {
    const response = await fetch(`${API_URL}/relationships`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topComponent,
        subComponent,
        amount: parseInt(amount), // Ensure it's an integer as per schema
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update relationship');
    }
    return await response.json();
  }

  static async deleteRelationship(topComponent, subComponent) {
    const response = await fetch(
      `${API_URL}/relationships?topComponent=${topComponent}&subComponent=${subComponent}`,
      {
        method: 'DELETE',
      },
    );
    if (!response.ok) {
      throw new Error('Failed to delete relationship');
    }
    return await response.json();
  }

  // Fuzzy search functionality for existing components
  static async fuzzySearchComponents(query) {
    try {
      // Get all components from the existing endpoint
      const response = await fetch(`${API_URL}/all_components`);
      const data = await this.handleResponse(response);
      const allComponents = data || [];
      
      // Implement client-side fuzzy search
      if (!query || query.length < 2) {
        return [];
      }
      
      const queryLower = query.toLowerCase();
      
      // Simple fuzzy search algorithm
      const matches = allComponents.filter(component => {
        const componentName = component.componentName || component.name || component;
        const nameLower = componentName.toLowerCase();
        
        // Exact match gets highest priority
        if (nameLower === queryLower) return true;
        
        // Starts with query
        if (nameLower.startsWith(queryLower)) return true;
        
        // Contains query
        if (nameLower.includes(queryLower)) return true;
        
        // Fuzzy match - check if all characters of query exist in order
        let queryIndex = 0;
        for (let i = 0; i < nameLower.length && queryIndex < queryLower.length; i++) {
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
        if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
        if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;
        
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
        .map(component => component.componentName || component.name || component);
        
    } catch (error) {
      console.error('Error performing fuzzy search:', error);
      return [];
    }
  }
}
