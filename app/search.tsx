import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { StorageService } from '@/utils/storage';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Workspace, Project, Node, Reminder } from '@/types';
import { ArrowLeft, Briefcase, Target, Bell, Calendar, Search as SearchIcon } from 'lucide-react-native';

interface SearchResult {
  id: string;
  type: 'workspace' | 'project' | 'node' | 'reminder';
  title: string;
  subtitle?: string;
  data: Workspace | Project | Node | Reminder;
}

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Perform search when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch(searchQuery.trim());
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const loadRecentSearches = async () => {
    try {
      const recent = await StorageService.getRecentSearches?.() || [];
      setRecentSearches(recent);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const [workspaces, projects, nodes, reminders] = await Promise.all([
        StorageService.getWorkspaces(),
        StorageService.getProjects(),
        StorageService.getNodes(),
        StorageService.getReminders(),
      ]);

      const searchResults: SearchResult[] = [];
      const lowerQuery = query.toLowerCase();

      // Search workspaces
      workspaces.forEach(workspace => {
        if (
          workspace.name.toLowerCase().includes(lowerQuery) ||
          workspace.description?.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            id: `workspace-${workspace.id}`,
            type: 'workspace',
            title: workspace.name,
            subtitle: `${workspace.projectCount} projects`,
            data: workspace,
          });
        }
      });

      // Search projects
      projects.forEach(project => {
        if (
          project.name.toLowerCase().includes(lowerQuery) ||
          project.description?.toLowerCase().includes(lowerQuery)
        ) {
          const workspace = workspaces.find(w => w.id === project.workspaceId);
          searchResults.push({
            id: `project-${project.id}`,
            type: 'project',
            title: project.name,
            subtitle: workspace ? `in ${workspace.name}` : undefined,
            data: project,
          });
        }
      });

      // Search nodes
      nodes.forEach(node => {
        if (
          node.title.toLowerCase().includes(lowerQuery) ||
          node.notes?.toLowerCase().includes(lowerQuery) ||
          node.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        ) {
          const project = projects.find(p => p.id === node.projectId);
          searchResults.push({
            id: `node-${node.id}`,
            type: 'node',
            title: node.title,
            subtitle: project ? `in ${project.name}` : undefined,
            data: node,
          });
        }
      });

      // Search reminders
      reminders.forEach(reminder => {
        if (reminder.title.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: `reminder-${reminder.id}`,
            type: 'reminder',
            title: reminder.title,
            subtitle: new Date(reminder.dueDate).toLocaleDateString(),
            data: reminder,
          });
        }
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    // Save to recent searches
    saveRecentSearch(searchQuery);

    // Navigate based on result type
    switch (result.type) {
      case 'workspace':
        router.push(`/workspaces/${result.data.id}`);
        break;
      case 'project':
        router.push(`/projects/${result.data.id}`);
        break;
      case 'node':
        const node = result.data as Node;
        router.push(`/projects/${node.projectId}`);
        break;
      case 'reminder':
        router.push('/(tabs)/calendar');
        break;
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updated);
      await StorageService.saveRecentSearches?.(updated);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await StorageService.saveRecentSearches?.([]);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'workspace': return Briefcase;
      case 'project': return Target;
      case 'node': return Calendar;
      case 'reminder': return Bell;
      default: return SearchIcon;
    }
  };

  const getResultColor = (result: SearchResult) => {
    if (result.type === 'workspace' || result.type === 'project') {
      return (result.data as Workspace | Project).color;
    }
    if (result.type === 'node') {
      return (result.data as Node).color;
    }
    return colors.primary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search workspaces, projects, tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Results */}
        {searchQuery.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Results ({results.length})
            </Text>
            
            {results.length > 0 ? (
              results.map((result) => {
                const IconComponent = getResultIcon(result.type);
                return (
                  <TouchableOpacity
                    key={result.id}
                    onPress={() => handleResultPress(result)}
                    activeOpacity={0.7}
                  >
                    <Card style={styles.resultCard}>
                      <View style={styles.resultContent}>
                        <View style={[styles.resultIcon, { backgroundColor: getResultColor(result) }]}>
                          <IconComponent size={20} color="#FFFFFF" />
                        </View>
                        <View style={styles.resultText}>
                          <Text style={[styles.resultTitle, { color: colors.text }]}>
                            {result.title}
                          </Text>
                          {result.subtitle && (
                            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                              {result.subtitle}
                            </Text>
                          )}
                        </View>
                        <View style={styles.resultMeta}>
                          <Text style={[styles.resultType, { color: colors.textSecondary }]}>
                            {result.type}
                          </Text>
                          {result.type === 'node' && (
                            <StatusChip status={(result.data as Node).status} size="small" />
                          )}
                          {result.type === 'project' && (
                            <StatusChip status={(result.data as Project).status} size="small" />
                          )}
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <SearchIcon size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No results found
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Searches */}
        {searchQuery.length === 0 && recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Searches
              </Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={[styles.clearText, { color: colors.primary }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
            
            {recentSearches.map((query, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleRecentSearchPress(query)}
                activeOpacity={0.7}
              >
                <Card style={styles.recentItem}>
                  <SearchIcon size={20} color={colors.textSecondary} />
                  <Text style={[styles.recentText, { color: colors.text }]}>
                    {query}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Tips */}
        {searchQuery.length === 0 && recentSearches.length === 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Search Tips
            </Text>
            
            <Card style={styles.tipsCard}>
              <View style={styles.tip}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>
                  Find workspaces
                </Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Search by workspace name or description
                </Text>
              </View>
              
              <View style={styles.tip}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>
                  Find projects
                </Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Search by project name or description
                </Text>
              </View>
              
              <View style={styles.tip}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>
                  Find tasks
                </Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Search by task title, notes, or tags
                </Text>
              </View>
              
              <View style={styles.tip}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>
                  Find reminders
                </Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Search by reminder title
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    marginBottom: 8,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
  },
  resultMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  resultType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 12,
  },
  recentText: {
    fontSize: 16,
    marginLeft: 12,
  },
  tipsCard: {
    paddingVertical: 8,
  },
  tip: {
    paddingVertical: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});