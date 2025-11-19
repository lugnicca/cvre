import Dexie, { Table } from 'dexie';

export interface Profile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  summary?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CvDoc {
  id: string;
  profileId: string;
  title: string;
  content: string;
  structured?: unknown;
  createdAt: number;
  updatedAt: number;
}

export interface JobPost {
  id: string;
  source: 'paste' | 'url';
  url?: string;
  language?: string;
  raw: string;
  parsed?: unknown;
  createdAt: number;
  updatedAt: number;
}

export interface Optimization {
  id: string;
  cvId: string;
  jobId: string;
  level: 'conservative' | 'moderate' | 'aggressive';
  result: string;
  score?: number;
  cost?: number;
  logs?: string[];
  createdAt: number;
}

export interface JobDetails {
  jobTitle: string;
  company: string;
  location?: string | null;
  keywords: string[];
  tools: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  profile: string;
  missions: string[];
  contractType?: string | null;
  salary?: string | null;
  benefits?: string[];
}

export interface OptimizedCV {
  id: string;
  jobTitle: string;
  company: string;
  jobSource: 'paste' | 'url';
  jobUrl?: string;
  jobDescription: string;
  jobDetails?: JobDetails;
  originalCV: unknown; // ParsedCVData structure
  optimizedCV: unknown; // ParsedCVData structure
  matchMode: 'light' | 'normal' | 'aggressive';
  language: 'fr' | 'en';
  matchScore: number;
  status: 'optimized' | 'sent' | 'interview' | 'rejected' | 'offer';
  sentAt?: number | null; // Timestamp when status changed to 'sent'
  changes: string[];
  suggestions: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Setting {
  key: string;
  value: unknown;
}

export interface ParsedCVData {
  name: string
  email: string
  phone: string
  about: string
  skills: string[]
  experience: Array<{
    title: string
    company: string
    period: string
    description: string | string[] // Support both string and bullet points
  }>
  education: Array<{
    degree: string
    institution: string
    period: string
    description?: string
  }>
  links?: Array<{
    name: string
    url: string
    icon?: string
  }>
  languages: Array<{
    name: string
    level: string
  }>
  hobbies: string[]
  certifications: string[]
}

export interface CVAnalysisStatus {
  status: 'idle' | 'extracting' | 'analyzing' | 'completed' | 'error'
  progress: number
  error?: string
  lastUpdated: number
  parsedData?: ParsedCVData
}

class CvreDB extends Dexie {
  profiles!: Table<Profile, string>;
  cvDocs!: Table<CvDoc, string>;
  jobPosts!: Table<JobPost, string>;
  optimizations!: Table<Optimization, string>;
  optimizedCVs!: Table<OptimizedCV, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('cvre');
    this.version(1).stores({
      profiles: 'id, name, updatedAt',
      cvDocs: 'id, profileId, title, updatedAt',
      jobPosts: 'id, source, updatedAt',
      optimizations: 'id, cvId, jobId, level, createdAt',
      settings: 'key',
    });

    // Add new version for optimizedCVs table
    this.version(2).stores({
      profiles: 'id, name, updatedAt',
      cvDocs: 'id, profileId, title, updatedAt',
      jobPosts: 'id, source, updatedAt',
      optimizations: 'id, cvId, jobId, level, createdAt',
      optimizedCVs: 'id, jobTitle, company, status, createdAt, updatedAt',
      settings: 'key',
    });
  }
}

export const db = new CvreDB();

