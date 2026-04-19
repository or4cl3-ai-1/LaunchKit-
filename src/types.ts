export interface UploadedFile {
  data: string; // base64
  mimeType: string;
  name: string;
}

export interface BusinessIdea {
  problem: string;
  solution: string;
  targetAudience: string;
  pricingStrategy: string;
  marketingChannels: string;
}

export interface Feedback {
  rating: number;
  comment: string;
}

export interface Deliverable {
  id: string;
  title: string;
  category: string;
  content: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  feedback?: Feedback;
}

export interface UserKit {
  id: string;
  name: string;
  ownerId?: string;
  updatedAt: number;
  idea: BusinessIdea;
  deliverables: Deliverable[];
  vibe: string;
  collaborators?: { email: string; role: 'owner' | 'editor' | 'viewer' }[];
  isPublic?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: number;
  deliverableId: string;
  kitId: string;
}
