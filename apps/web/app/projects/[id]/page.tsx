'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Sparkles,
  FolderOpen,
  File,
  Plus,
  Save,
  Play,
  Rocket,
  History,
  Settings,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Download,
  Share2,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center">Loading editor...</div> }
);

interface ProjectFile {
  id: string;
  path: string;
  content: string;
  isDirectory: boolean;
}

interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  file?: ProjectFile;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, checkAuth } = useAuthStore();

  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showPromptPanel, setShowPromptPanel] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('GROK_4_1_FAST');

  useEffect(() => {
    checkAuth();
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProject(projectId);
      setProject(data);
      setFiles(data.files || []);

      // Auto-select first non-directory file
      const firstFile = data.files?.find((f: ProjectFile) => !f.isDirectory);
      if (firstFile) {
        setActiveFile(firstFile);
        setEditorContent(firstFile.content);
      }

      // Expand root folders
      const rootFolders = new Set<string>();
      data.files?.forEach((f: ProjectFile) => {
        const parts = f.path.split('/');
        if (parts.length > 1) {
          rootFolders.add(parts[0]);
        }
      });
      setExpandedFolders(rootFolders);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive',
      });
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const buildFileTree = (files: ProjectFile[]): FileTreeNode[] => {
    const root: FileTreeNode[] = [];
    const dirMap = new Map<string, FileTreeNode>();

    // Sort files by path
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    sortedFiles.forEach((file) => {
      const parts = file.path.split('/');
      let currentLevel = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = index === parts.length - 1;

        if (isLast && !file.isDirectory) {
          currentLevel.push({
            name: part,
            path: file.path,
            isDirectory: false,
            file,
          });
        } else {
          let dir = dirMap.get(currentPath);
          if (!dir) {
            dir = {
              name: part,
              path: currentPath,
              isDirectory: true,
              children: [],
            };
            dirMap.set(currentPath, dir);
            currentLevel.push(dir);
          }
          currentLevel = dir.children!;
        }
      });
    });

    return root;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileSelect = (file: ProjectFile) => {
    if (activeFile && editorContent !== activeFile.content) {
      // Auto-save before switching
      saveFile();
    }
    setActiveFile(file);
    setEditorContent(file.content);
  };

  const saveFile = async () => {
    if (!activeFile) return;

    setIsSaving(true);
    try {
      await api.updateFile(projectId, activeFile.id, { content: editorContent });
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFile.id ? { ...f, content: editorContent } : f))
      );
      setActiveFile({ ...activeFile, content: editorContent });
      toast({
        title: 'Saved',
        description: 'File saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save file',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const result = await api.generateCode(projectId, {
        prompt,
        model: selectedModel,
      });

      toast({
        title: 'Generation started',
        description: 'AI is generating your code...',
      });

      // Poll for completion
      const pollJob = async () => {
        try {
          const job = await api.getGenerationJob(projectId, result.jobId);
          if (job.status === 'COMPLETED') {
            await loadProject();
            toast({
              title: 'Generation complete!',
              description: 'Your code has been generated.',
            });
            setShowPromptPanel(false);
            setPrompt('');
          } else if (job.status === 'FAILED') {
            toast({
              title: 'Generation failed',
              description: job.error || 'Something went wrong',
              variant: 'destructive',
            });
          } else {
            setTimeout(pollJob, 2000);
          }
        } catch {
          setTimeout(pollJob, 2000);
        }
      };

      pollJob();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start generation',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createCheckpoint = async () => {
    const summary = window.prompt('Enter checkpoint description:');
    if (!summary) return;

    try {
      await api.createCheckpoint(projectId, summary);
      toast({
        title: 'Checkpoint created',
        description: 'Your project state has been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkpoint',
        variant: 'destructive',
      });
    }
  };

  const handleBuild = async () => {
    try {
      await api.buildProject(projectId);
      toast({
        title: 'Build started',
        description: 'Building your project...',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start build',
        variant: 'destructive',
      });
    }
  };

  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      java: 'java',
      kt: 'kotlin',
      py: 'python',
      json: 'json',
      yml: 'yaml',
      yaml: 'yaml',
      xml: 'xml',
      md: 'markdown',
      gradle: 'groovy',
      properties: 'properties',
      toml: 'toml',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fileTree = buildFileTree(files);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">ForgeCraft AI</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{project?.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-muted rounded px-2 py-1 text-sm">
            <Coins className="h-4 w-4 text-primary" />
            <span>{user?.tokenBalance || 0}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPromptPanel(!showPromptPanel)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </Button>
          <Button variant="outline" size="sm" onClick={saveFile} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={createCheckpoint}>
            <History className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleBuild}>
            <Play className="h-4 w-4" />
          </Button>
          {project?.platform?.startsWith('DISCORD') && (
            <Button size="sm">
              <Rocket className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-64 border-r flex flex-col overflow-hidden">
          <div className="p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Files</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <FileTreeView
              nodes={fileTree}
              expandedFolders={expandedFolders}
              activeFile={activeFile}
              onToggleFolder={toggleFolder}
              onSelectFile={handleFileSelect}
            />
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeFile ? (
            <>
              <div className="h-10 border-b px-4 flex items-center bg-muted/50">
                <span className="text-sm">{activeFile.path}</span>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={getLanguage(activeFile.path)}
                  value={editorContent}
                  onChange={(value) => setEditorContent(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a file to edit</p>
              </div>
            </div>
          )}
        </div>

        {/* Prompt Panel */}
        {showPromptPanel && (
          <div className="w-96 border-l flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">AI Generation</h3>
              <p className="text-sm text-muted-foreground">Describe what you want to build</p>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-auto">
              <div>
                <label className="text-sm font-medium">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Add a /home command that teleports players to their spawn point..."
                  className="w-full h-40 mt-1 px-3 py-2 rounded-md border bg-background resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-md border bg-background"
                >
                  <option value="GROK_4_1_FAST">Grok 4.1 Fast (Budget)</option>
                  <option value="CLAUDE_SONNET_4_5">Claude Sonnet 4.5 (Fast)</option>
                  <option value="GPT_5">GPT-5 (Versatile)</option>
                  <option value="GEMINI_3_PRO">Gemini 3 Pro (Long context)</option>
                  <option value="CLAUDE_OPUS_4_5">Claude Opus 4.5 (Best)</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t">
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FileTreeView({
  nodes,
  expandedFolders,
  activeFile,
  onToggleFolder,
  onSelectFile,
  depth = 0,
}: {
  nodes: FileTreeNode[];
  expandedFolders: Set<string>;
  activeFile: ProjectFile | null;
  onToggleFolder: (path: string) => void;
  onSelectFile: (file: ProjectFile) => void;
  depth?: number;
}) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <div key={node.path}>
          <div
            className={`flex items-center px-2 py-1 rounded cursor-pointer hover:bg-accent/50 ${
              !node.isDirectory && activeFile?.path === node.path ? 'bg-accent' : ''
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (node.isDirectory) {
                onToggleFolder(node.path);
              } else if (node.file) {
                onSelectFile(node.file);
              }
            }}
          >
            {node.isDirectory ? (
              <>
                {expandedFolders.has(node.path) ? (
                  <ChevronDown className="h-4 w-4 mr-1 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />
                )}
                <FolderOpen className="h-4 w-4 mr-2 text-yellow-500" />
              </>
            ) : (
              <>
                <span className="w-4 mr-1" />
                <File className="h-4 w-4 mr-2 text-blue-400" />
              </>
            )}
            <span className="text-sm truncate">{node.name}</span>
          </div>
          {node.isDirectory && expandedFolders.has(node.path) && node.children && (
            <FileTreeView
              nodes={node.children}
              expandedFolders={expandedFolders}
              activeFile={activeFile}
              onToggleFolder={onToggleFolder}
              onSelectFile={onSelectFile}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}
