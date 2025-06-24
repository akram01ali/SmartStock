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

  static async createComponent(componentData) {
    const response = await fetch(`${API_URL}/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });
    if (!response.ok) {
      throw new Error('Failed to create component');
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

  static async deleteComponent(componentName) {
    const response = await fetch(
      `${API_URL}/components?componentName=${componentName}`,
      {
        method: 'DELETE',
      },
    );
    if (!response.ok) {
      throw new Error('Failed to delete component');
    }
    return await response.json();
  }

  // Relationships endpoints
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
}
