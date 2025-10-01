/**
 * Lightcast Open Skills API Client
 * Primary skills taxonomy source (30,000+ skills)
 * https://skills.emsidata.com/
 */

const LIGHTCAST_API_BASE = 'https://emsiservices.com/skills';
const LIGHTCAST_AUTH_URL = 'https://auth.emsicloud.com/connect/token';
const LIGHTCAST_CLIENT_ID = process.env.LIGHTCAST_CLIENT_ID || '';
const LIGHTCAST_CLIENT_SECRET = process.env.LIGHTCAST_CLIENT_SECRET || '';

interface LightcastSkill {
  id: string;
  name: string;
  type: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  subcategory?: {
    id: string;
    name: string;
  };
  description?: string;
  infoUrl?: string;
}

interface LightcastAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class LightcastClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Authenticate with Lightcast API
   */
  private async authenticate(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(LIGHTCAST_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: LIGHTCAST_CLIENT_ID,
        client_secret: LIGHTCAST_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'emsi_open',
      }),
    });

    if (!response.ok) {
      throw new Error(`Lightcast auth failed: ${response.statusText}`);
    }

    const data: LightcastAuthResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early

    return this.accessToken;
  }

  /**
   * Fetch all skills from Lightcast Open Skills
   */
  async getAllSkills(): Promise<LightcastSkill[]> {
    const token = await this.authenticate();
    
    const response = await fetch(`${LIGHTCAST_API_BASE}/versions/latest/skills`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lightcast API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Search for skills by query
   */
  async searchSkills(query: string, limit: number = 100): Promise<LightcastSkill[]> {
    const token = await this.authenticate();
    
    const response = await fetch(`${LIGHTCAST_API_BASE}/versions/latest/skills`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`Lightcast search error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get skills for a specific occupation (by name or O*NET code)
   */
  async getOccupationSkills(occupationQuery: string): Promise<LightcastSkill[]> {
    const token = await this.authenticate();
    
    // First, search for the occupation
    const occResponse = await fetch(`${LIGHTCAST_API_BASE}/versions/latest/occupations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: occupationQuery,
        limit: 1,
      }),
    });

    if (!occResponse.ok) {
      throw new Error(`Lightcast occupation search error: ${occResponse.statusText}`);
    }

    const occData = await occResponse.json();
    if (!occData.data || occData.data.length === 0) {
      return [];
    }

    const occupationId = occData.data[0].id;

    // Get skills for this occupation
    const skillsResponse = await fetch(
      `${LIGHTCAST_API_BASE}/versions/latest/occupations/${occupationId}/skills`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!skillsResponse.ok) {
      throw new Error(`Lightcast occupation skills error: ${skillsResponse.statusText}`);
    }

    const skillsData = await skillsResponse.json();
    return skillsData.data || [];
  }

  /**
   * Map Lightcast skill to our database format
   */
  mapToDBFormat(skill: LightcastSkill) {
    return {
      name: skill.name,
      lightcast_id: skill.id,
      category: skill.category?.name || skill.type?.name || 'General',
      description: skill.description || '',
      source: 'LIGHTCAST',
      source_version: 'latest',
      is_active: true,
    };
  }
}

export const lightcastClient = new LightcastClient();
