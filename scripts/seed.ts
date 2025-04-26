import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create demo user
    const password = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        name: 'Demo User',
        email: 'demo@example.com',
        password,
        role: 'user',
        department: 'Engineering',
      },
    });

    // Create some categories
    const webDev = await prisma.category.upsert({
      where: { name: 'Web Development' },
      update: {},
      create: { name: 'Web Development' },
    });

    const cms = await prisma.category.upsert({
      where: { name: 'CMS' },
      update: {},
      create: { name: 'CMS' },
    });

    // Create projects
    const cmsProject = await prisma.project.create({
      data: {
        name: 'CMS Krimum',
        description: 'Content management system for Krimum',
        priority: 'high',
        categoryId: cms.id,
      },
    });

    // Create some updates
    await prisma.update.create({
      data: {
        userId: user.id,
        projectId: cmsProject.id,
        tasks: JSON.stringify([
          { description: 'Setup CMS using Laravel 11, Inertia', completed: true },
          { description: 'Management account and permission', completed: true },
          { description: 'CRUD profiles, department, himbauan, galeri', completed: true },
          { description: 'API profiles, department, himbauan, galeri', completed: false },
        ]),
        source: 'manual',
      },
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
