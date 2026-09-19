import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a sample job
  const job = await prisma.job.create({
    data: {
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'Remote (US)',
      employmentType: 'full_time',
      experienceLevel: 'senior',
      status: 'active',
      description: `We're looking for a Senior Frontend Engineer to lead the development of our customer-facing product. You'll work closely with design, product, and backend teams to build fast, accessible, and delightful user interfaces at scale.

You will own the frontend architecture for our core product surfaces, contribute to our design system, and mentor junior engineers. We value engineers who care deeply about user experience and can translate complex requirements into elegant, maintainable code.`,
      hiringStage: 'Screening',
      requirements: {
        create: [
          { type: 'required', category: 'skill', label: 'React', description: 'Production React application development' },
          { type: 'required', category: 'skill', label: 'TypeScript', description: 'Strong TypeScript proficiency' },
          { type: 'required', category: 'experience', label: '3+ years frontend development', description: 'Minimum three years of professional frontend engineering' },
          { type: 'required', category: 'skill', label: 'CSS / design systems', description: 'Ability to build and maintain design systems' },
          { type: 'preferred', category: 'skill', label: 'Next.js', description: 'Experience with Next.js and SSR' },
          { type: 'preferred', category: 'skill', label: 'Performance optimization', description: 'Frontend performance, Core Web Vitals, bundle optimization' },
          { type: 'preferred', category: 'domain', label: 'Design system contributions', description: 'Built or contributed to a shared component library' },
          { type: 'preferred', category: 'experience', label: 'Team/tech leadership', description: 'Led a frontend team or mentored junior engineers' },
        ],
      },
    },
    include: { requirements: true },
  });

  console.log(`✅ Created job: ${job.title}`);

  // Create sample candidates
  const candidates = [
    {
      name: 'Aarav Mehta',
      firstName: 'Aarav',
      lastName: 'Mehta',
      email: 'aarav.mehta@email.com',
      currentRole: 'Senior Frontend Engineer',
      currentCompany: 'Zenpay',
      location: 'San Francisco, CA',
      yearsExperience: 6,
      skills: ['React', 'TypeScript', 'Next.js', 'Webpack', 'CSS-in-JS', 'Storybook', 'GraphQL', 'Jest', 'Playwright'],
      education: 'B.Tech Computer Science, IIT Bombay, 2020',
      stage: 'interview' as const,
      group: 'strong_match' as const,
      requirementCoverage: 85,
      validationNeeded: false,
      initials: 'AM',
      avatarColor: '#3730a3',
    },
    {
      name: 'Sophie Chen',
      firstName: 'Sophie',
      lastName: 'Chen',
      email: 'sophie.chen@email.com',
      currentRole: 'Frontend Engineer',
      currentCompany: 'Headspace',
      location: 'Los Angeles, CA',
      yearsExperience: 4,
      skills: ['React', 'JavaScript', 'SCSS', 'Framer Motion', 'Figma-to-code', 'TypeScript'],
      education: 'B.Sc Interactive Media Design, Parsons School of Design, 2022',
      stage: 'screening' as const,
      group: 'potential_match' as const,
      requirementCoverage: 60,
      validationNeeded: true,
      initials: 'SC',
      avatarColor: '#0369a1',
    },
    {
      name: 'Marcos Silva',
      firstName: 'Marcos',
      lastName: 'Silva',
      email: 'marcos.silva@email.com',
      currentRole: 'Senior Engineer',
      currentCompany: 'Shopify',
      location: 'Toronto, Canada',
      yearsExperience: 5,
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL', 'Next.js', 'Remix'],
      education: 'B.Sc Software Engineering, University of Waterloo, 2021',
      stage: 'applied' as const,
      group: 'potential_match' as const,
      requirementCoverage: 70,
      validationNeeded: true,
      initials: 'MS',
      avatarColor: '#065f46',
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