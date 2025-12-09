export interface PortainerConfig {
  url: string;
  apiToken: string;
  endpointId: string;
}

export interface CreateStackParams {
  stackName: string;
  composeYaml: string;
}

export interface PortainerStack {
  Id: number;
  Name: string;
  Status: number;
  CreationDate: number;
  UpdateDate: number;
}

export class PortainerClient {
  private config: PortainerConfig;

  constructor(config: PortainerConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      'X-API-Key': this.config.apiToken,
      'Content-Type': 'application/json',
    };
  }

  async createMauticStack(params: CreateStackParams): Promise<PortainerStack> {
    const { stackName, composeYaml } = params;

    const body = {
      Name: stackName,
      SwarmID: 'swarm-cluster',
      StackFileContent: composeYaml,
    };

    const url = `${this.config.url}/api/stacks?type=1&method=string&endpointId=${this.config.endpointId}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Portainer API error (${response.status}): ${errorText}`
        );
      }

      const stack = await response.json();
      return stack;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create stack: ${error.message}`);
      }
      throw error;
    }
  }

  async getStack(stackName: string): Promise<PortainerStack | null> {
    const url = `${this.config.url}/api/stacks`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Portainer API error (${response.status}): ${errorText}`
        );
      }

      const stacks: PortainerStack[] = await response.json();
      const stack = stacks.find(
        (s) => s.Name.toLowerCase() === stackName.toLowerCase()
      );

      return stack || null;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get stack: ${error.message}`);
      }
      throw error;
    }
  }

  async deleteStack(stackId: number): Promise<void> {
    const url = `${this.config.url}/api/stacks/${stackId}?endpointId=${this.config.endpointId}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Portainer API error (${response.status}): ${errorText}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete stack: ${error.message}`);
      }
      throw error;
    }
  }
}

export function createPortainerClient(): PortainerClient {
  const config: PortainerConfig = {
    url: process.env.PORTAINER_URL || '',
    apiToken: process.env.PORTAINER_API_TOKEN || '',
    endpointId: process.env.PORTAINER_ENDPOINT_ID || '1',
  };

  if (!config.url || !config.apiToken) {
    throw new Error('Portainer configuration is missing. Check environment variables.');
  }

  return new PortainerClient(config);
}
