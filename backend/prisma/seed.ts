import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data to prevent duplicates
  console.log('🧹 Clearing existing data...');
  await prisma.job.deleteMany();

  // Create a sample job
  const job = await prisma.job.create({
    data: {
      title: 'Data Science Intern',
      department: 'Data Science',
      location: 'Remote (India)',
      employmentType: 'internship',
      experienceLevel: 'entry_level',
      status: 'active',
      description: `Skillzenloop is offering a Data Science Internship for freshers and aspiring data professionals who want to explore data preparation, statistical analysis, Python programming, visualization, and machine learning.

This internship is designed for candidates who want to understand how raw datasets can be transformed into meaningful insights and predictive solutions. Interns will work on analytical and data-focused assignments while developing their technical and problem-solving abilities.

Stipend: ₹16,500/month
Application Deadline: 01 October 2026`,
      hiringStage: 'Screening',
      requirements: {
        create: [
          { type: 'required', category: 'skill', label: 'Python', description: 'Use Python to manipulate and analyze datasets' },
          { type: 'required', category: 'skill', label: 'SQL', description: 'Querying and database knowledge' },
          { type: 'required', category: 'skill', label: 'Statistics', description: 'Apply basic statistical methods to data problems' },
          { type: 'required', category: 'skill', label: 'Pandas & NumPy', description: 'Work with structured datasets' },
          { type: 'required', category: 'skill', label: 'Data Cleaning', description: 'Handle missing values, duplicates, and inconsistent records' },
          { type: 'preferred', category: 'skill', label: 'Machine Learning', description: 'Implement basic ML algorithms' },
          { type: 'preferred', category: 'skill', label: 'Data Visualization', description: 'Create charts and visualizations' },
        ],
      },
    },
    include: { requirements: true },
  });

  console.log(`✅ Created job: ${job.title}`);

  // Create sample candidates
  const candidates = [
    {
      name: 'Rohan Sharma',
      firstName: 'Rohan',
      lastName: 'Sharma',
      email: 'rohan.s@email.com',
      currentRole: 'Student',
      currentCompany: 'Delhi University',
      location: 'Delhi, India',
      yearsExperience: 0,
      skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-Learn', 'Matplotlib'],
      education: 'B.Sc Statistics, Delhi University, 2026',
      stage: 'screening' as const,
      group: 'strong_match' as const,
      requirementCoverage: 90,
      validationNeeded: false,
    },
    {
      name: 'Priya Patel',
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.p@email.com',
      currentRole: 'Data Enthusiast',
      currentCompany: '',
      location: 'Mumbai, India',
      yearsExperience: 0,
      skills: ['Python', 'Excel', 'Tableau', 'Data Cleaning'],
      education: 'B.Tech IT, Mumbai University, 2025',
      stage: 'applied' as const,
      group: 'potential_match' as const,
      requirementCoverage: 60,
      validationNeeded: true,
    },
    {
      name: 'Aditya Kumar',
      firstName: 'Aditya',
      lastName: 'Kumar',
      email: 'aditya.k@email.com',
      currentRole: 'Intern',
      currentCompany: 'StartupInc',
      location: 'Bangalore, India',
      yearsExperience: 1,
      skills: ['Python', 'SQL', 'PostgreSQL', 'Machine Learning', 'TensorFlow', 'Pandas'],
      education: 'B.E Computer Science, VTU, 2024',
      stage: 'interview' as const,
      group: 'potential_match' as const,
      requirementCoverage: 80,
      validationNeeded: true,
    },
  ];

  for (const candidateData of candidates) {
    const candidate = await prisma.candidate.create({
      data: {
        ...candidateData,
        jobId: job.id,
      },
    });
    console.log(`✅ Created candidate: ${candidate.name}`);
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });