import { Job, Requirement } from '@/types';

const frontendRequirements: Requirement[] = [
  { id: 'req-fe-1', type: 'required', category: 'skill', label: 'React', description: 'Production React application development' },
  { id: 'req-fe-2', type: 'required', category: 'skill', label: 'TypeScript', description: 'Strong TypeScript proficiency' },
  { id: 'req-fe-3', type: 'required', category: 'experience', label: '3+ years frontend development', description: 'Minimum three years of professional frontend engineering' },
  { id: 'req-fe-4', type: 'required', category: 'skill', label: 'CSS / design systems', description: 'Ability to build and maintain design systems' },
  { id: 'req-fe-5', type: 'preferred', category: 'skill', label: 'Next.js', description: 'Experience with Next.js and SSR' },
  { id: 'req-fe-6', type: 'preferred', category: 'skill', label: 'Performance optimization', description: 'Frontend performance, Core Web Vitals, bundle optimization' },
  { id: 'req-fe-7', type: 'preferred', category: 'domain', label: 'Design system contributions', description: 'Built or contributed to a shared component library' },
  { id: 'req-fe-8', type: 'preferred', category: 'experience', label: 'Team/tech leadership', description: 'Led a frontend team or mentored junior engineers' },
];

const mlRequirements: Requirement[] = [
  { id: 'req-ml-1', type: 'required', category: 'skill', label: 'Python', description: 'Advanced Python for ML pipelines' },
  { id: 'req-ml-2', type: 'required', category: 'skill', label: 'PyTorch or TensorFlow', description: 'Deep learning framework experience' },
  { id: 'req-ml-3', type: 'required', category: 'experience', label: '4+ years ML engineering', description: 'Production ML systems' },
  { id: 'req-ml-4', type: 'required', category: 'skill', label: 'MLOps / model deployment', description: 'End-to-end model deployment' },
  { id: 'req-ml-5', type: 'preferred', category: 'skill', label: 'LLM fine-tuning', description: 'Experience fine-tuning large language models' },
  { id: 'req-ml-6', type: 'preferred', category: 'domain', label: 'NLP / text understanding', description: 'Natural language processing applications' },
];

const designRequirements: Requirement[] = [
  { id: 'req-des-1', type: 'required', category: 'skill', label: 'Figma', description: 'Expert Figma proficiency' },
  { id: 'req-des-2', type: 'required', category: 'skill', label: 'Product design', description: 'End-to-end product design from discovery to delivery' },
  { id: 'req-des-3', type: 'required', category: 'experience', label: '5+ years UX/product design', description: 'Senior-level design experience' },
  { id: 'req-des-4', type: 'preferred', category: 'skill', label: 'Design systems', description: 'Design token and component library creation' },
  { id: 'req-des-5', type: 'preferred', category: 'domain', label: 'B2B SaaS experience', description: 'Experience designing complex enterprise tools' },
];

const backendRequirements: Requirement[] = [
  { id: 'req-be-1', type: 'required', category: 'skill', label: 'Go or Rust', description: 'High-performance systems programming' },
  { id: 'req-be-2', type: 'required', category: 'skill', label: 'Distributed systems', description: 'Experience with distributed architectures' },
  { id: 'req-be-3', type: 'required', category: 'experience', label: '5+ years backend engineering', description: 'Senior backend engineering' },
  { id: 'req-be-4', type: 'required', category: 'skill', label: 'PostgreSQL / databases', description: 'Database design and optimization' },
  { id: 'req-be-5', type: 'preferred', category: 'skill', label: 'Kubernetes / infrastructure', description: 'Container orchestration experience' },
  { id: 'req-be-6', type: 'preferred', category: 'domain', label: 'High-scale API design', description: 'APIs serving millions of requests' },
];

export const mockJobs: Job[] = [
  {
    id: 'job-fe-001',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Remote (US)',
    employmentType: 'full_time',
    experienceLevel: 'senior',
    status: 'active',
    description: `We're looking for a Senior Frontend Engineer to lead the development of our customer-facing product. You'll work closely with design, product, and backend teams to build fast, accessible, and delightful user interfaces at scale.

You will own the frontend architecture for our core product surfaces, contribute to our design system, and mentor junior engineers. We value engineers who care deeply about user experience and can translate complex requirements into elegant, maintainable code.`,
    requirements: frontendRequirements,
    candidateCount: 24,
    interviewCount: 8,
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-09-18T14:22:00Z',
    hiringStage: 'Interview',
  },
  {
    id: 'job-ml-002',
    title: 'Machine Learning Engineer',
    department: 'AI Research',
    location: 'San Francisco, CA',
    employmentType: 'full_time',
    experienceLevel: 'senior',
    status: 'active',
    description: `Join our AI team to build and productionize machine learning models that power our core product features. You'll work on everything from data pipeline design to model training, evaluation, and deployment.`,
    requirements: mlRequirements,
    candidateCount: 18,
    interviewCount: 5,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-09-17T11:45:00Z',
    hiringStage: 'Screening',
  },
  {
    id: 'job-des-003',
    title: 'Product Designer',
    department: 'Design',
    location: 'New York, NY',
    employmentType: 'full_time',
    experienceLevel: 'senior',
    status: 'active',
    description: `We need a Product Designer who can lead design for complex B2B workflows. You'll own the entire design process from research through high-fidelity prototypes, working directly with engineering and stakeholders.`,
    requirements: designRequirements,
    candidateCount: 31,
    interviewCount: 12,
    createdAt: '2026-07-10T09:00:00Z',
    updatedAt: '2026-09-19T09:15:00Z',
    hiringStage: 'Evaluation',
  },
  {
    id: 'job-be-004',
    title: 'Backend Engineer',
    department: 'Platform',
    location: 'Remote (Global)',
    employmentType: 'full_time',
    experienceLevel: 'senior',
    status: 'draft',
    description: `We're building a high-performance platform team and looking for a Backend Engineer with strong distributed systems experience. You'll design and operate services handling millions of API requests per day.`,
    requirements: backendRequirements,
    candidateCount: 0,
    interviewCount: 0,
    createdAt: '2026-09-18T16:00:00Z',
    updatedAt: '2026-09-18T16:00:00Z',
    hiringStage: 'Draft',
  },
];

export const getJobRequirements = (jobId: string): Requirement[] => {
  const job = mockJobs.find(j => j.id === jobId);
  return job?.requirements ?? [];
};
