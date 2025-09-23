import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workspace, Project } from '@/types';

const WORKSPACES_KEY = 'workspaces';
const PROJECTS_KEY = 'projects';

export const StorageService = {
  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const data = await AsyncStorage.getItem(WORKSPACES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading workspaces:', error);
      return [];
    }
  },

  async saveWorkspaces(workspaces: Workspace[]): Promise<void> {
    try {
      await AsyncStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
    } catch (error) {
      console.error('Error saving workspaces:', error);
      throw error;
    }
  },

  async addWorkspace(workspace: Workspace): Promise<void> {
    try {
      const workspaces = await this.getWorkspaces();
      workspaces.push(workspace);
      await this.saveWorkspaces(workspaces);
    } catch (error) {
      console.error('Error adding workspace:', error);
    }
  },

  async updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Promise<void> {
    try {
      const workspaces = await this.getWorkspaces();
      const index = workspaces.findIndex(w => w.id === workspaceId);
      if (index !== -1) {
        workspaces[index] = { ...workspaces[index], ...updates };
        await this.saveWorkspaces(workspaces);
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
    }
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    try {
      const workspaces = await this.getWorkspaces();
      const filteredWorkspaces = workspaces.filter(w => w.id !== workspaceId);
      await this.saveWorkspaces(filteredWorkspaces);
    } catch (error) {
      console.error('Error deleting workspace:', error);
    }
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const data = await AsyncStorage.getItem(PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  },

  async getProjectsByWorkspace(workspaceId: string): Promise<Project[]> {
    try {
      const projects = await this.getProjects();
      return projects.filter(project => project.workspaceId === workspaceId);
    } catch (error) {
      console.error('Error loading projects by workspace:', error);
      return [];
    }
  },

  async saveProjects(projects: Project[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  },

  async addProject(project: Project): Promise<void> {
    try {
      const projects = await this.getProjects();
      projects.push(project);
      await this.saveProjects(projects);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const projects = await this.getProjects();
      const index = projects.findIndex(p => p.id === projectId);
      if (index !== -1) {
        projects[index] = { ...projects[index], ...updates };
        await this.saveProjects(projects);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  },

  async deleteProject(projectId: string): Promise<void> {
    try {
      const projects = await this.getProjects();
      const filteredProjects = projects.filter(p => p.id !== projectId);
      await this.saveProjects(filteredProjects);
      
      // Also delete all nodes in this project
      const nodes = await this.getNodes();
      const filteredNodes = nodes.filter(n => n.projectId !== projectId);
      await this.saveNodes(filteredNodes);
      
      // Delete all reminders for this project
      const reminders = await this.getReminders();
      const filteredReminders = reminders.filter(r => r.projectId !== projectId);
      await this.saveReminders(filteredReminders);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  },

  // Nodes
  async getNodes(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('nodes');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading nodes:', error);
      return [];
    }
  },

  async getNodesByProject(projectId: string): Promise<any[]> {
    try {
      const nodes = await this.getNodes();
      return nodes.filter(node => node.projectId === projectId);
    } catch (error) {
      console.error('Error loading nodes by project:', error);
      return [];
    }
  },

  async saveNodes(nodes: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('nodes', JSON.stringify(nodes));
    } catch (error) {
      console.error('Error saving nodes:', error);
    }
  },

  async addNode(node: any): Promise<void> {
    try {
      const nodes = await this.getNodes();
      nodes.push(node);
      await this.saveNodes(nodes);
      
      // Update project node count
      await this.updateProjectNodeCount(node.projectId);
    } catch (error) {
      console.error('Error adding node:', error);
    }
  },

  async updateNode(nodeId: string, updates: any): Promise<void> {
    try {
      const nodes = await this.getNodes();
      const index = nodes.findIndex(n => n.id === nodeId);
      if (index !== -1) {
        nodes[index] = { ...nodes[index], ...updates };
        await this.saveNodes(nodes);
      }
    } catch (error) {
      console.error('Error updating node:', error);
    }
  },

  async deleteNode(nodeId: string): Promise<void> {
    try {
      const nodes = await this.getNodes();
      const nodeToDelete = nodes.find(n => n.id === nodeId);
      if (nodeToDelete) {
        const filteredNodes = nodes.filter(n => n.id !== nodeId);
        await this.saveNodes(filteredNodes);
        
        // Update project node count
        await this.updateProjectNodeCount(nodeToDelete.projectId);
      }
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  },

  // Reminders and Calendar
  async getReminders(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('reminders');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading reminders:', error);
      return [];
    }
  },

  async saveReminders(reminders: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  },

  async addReminder(reminder: any): Promise<void> {
    try {
      const reminders = await this.getReminders();
      reminders.push(reminder);
      await this.saveReminders(reminders);
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  },

  async updateReminder(reminderId: string, updates: any): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const index = reminders.findIndex(r => r.id === reminderId);
      if (index !== -1) {
        reminders[index] = { ...reminders[index], ...updates };
        await this.saveReminders(reminders);
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  },

  async deleteReminder(reminderId: string): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const filteredReminders = reminders.filter(r => r.id !== reminderId);
      await this.saveReminders(filteredReminders);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  },

  async getRemindersByDate(date: string): Promise<any[]> {
    try {
      const reminders = await this.getReminders();
      return reminders.filter(reminder => {
        const reminderDate = new Date(reminder.dueDate).toDateString();
        const targetDate = new Date(date).toDateString();
        return reminderDate === targetDate;
      });
    } catch (error) {
      console.error('Error loading reminders by date:', error);
      return [];
    }
  },

  async getOverdueReminders(): Promise<any[]> {
    try {
      const reminders = await this.getReminders();
      const now = new Date();
      return reminders.filter(reminder => 
        !reminder.isCompleted && new Date(reminder.dueDate) < now
      );
    } catch (error) {
      console.error('Error loading overdue reminders:', error);
      return [];
    }
  },

  async getUpcomingReminders(days: number = 7): Promise<any[]> {
    try {
      const reminders = await this.getReminders();
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);
      
      return reminders.filter(reminder => {
        const reminderDate = new Date(reminder.dueDate);
        return !reminder.isCompleted && reminderDate >= now && reminderDate <= futureDate;
      });
    } catch (error) {
      console.error('Error loading upcoming reminders:', error);
      return [];
    }
  },

  async updateProjectNodeCount(projectId: string): Promise<void> {
    try {
      const nodes = await this.getNodesByProject(projectId);
      await this.updateProject(projectId, { nodeCount: nodes.length });
    } catch (error) {
      console.error('Error updating project node count:', error);
    }
  },

  async updateWorkspaceProjectCount(workspaceId: string): Promise<void> {
    try {
      const projects = await this.getProjectsByWorkspace(workspaceId);
      await this.updateWorkspace(workspaceId, { projectCount: projects.length });
    } catch (error) {
      console.error('Error updating workspace project count:', error);
    }
  },

  // Search functionality
  async getRecentSearches(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem('recent_searches');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading recent searches:', error);
      return [];
    }
  },

  async saveRecentSearches(searches: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem('recent_searches', JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  },
};