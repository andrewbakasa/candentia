
import { PrismaClient } from '@prisma/client';

interface InvestmentPortfolio {
  title: string;
  description: string;
  type: 'real estate' | 'stocks' | 'startup' | 'other';
  country: string;
  targetAmount: number;
  raisedAmount: number;
  imageUrl: string;
  expectedReturn?: string; // e.g., "505% annually"
}

const seedPortfolios: InvestmentPortfolio[] = [
  {
    
    title: 'Luxury Apartments in Dubai',
    description:
      'Invest in a high-yield real estate project in the heart of Dubai, offering luxury apartments with world-class amenities.',
    type: 'real estate',
    country: 'UAE',
    targetAmount: 1000000,
    raisedAmount: 650000,
    imageUrl:
      'https://images.unsplash.com/photo-1588007165057-a09534555942?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    expectedReturn: '12% annually',
  },
  {
   
    title: 'Tech Startup in Silicon Valley',
    description:
      'Be part of the next big tech disruptor! Invest in an early-stage startup developing AI-powered solutions.',
    type: 'startup',
    country: 'USA',
    targetAmount: 500000,
    raisedAmount: 120000,
    imageUrl:
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?q=80&w=3283&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    expectedReturn: 'Potential for 10x return in 5 years',
  },
  {
    
    title: 'Renewable Energy Project in Germany',
    description:
      'Invest in a sustainable future with a solar energy project in Germany, offering stable returns and environmental impact.',
    type: 'real estate',
    country: 'Germany',
    targetAmount: 750000,
    raisedAmount: 750000,
    imageUrl:
      'https://images.unsplash.com/photo-1502117879504-f570a539e8b7?q=80&w=3212&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    expectedReturn: '8% annually',
  },
  {
   
    title: 'Emerging Market Stocks Fund',
    description:
      'Diversify your portfolio with a fund focused on high-growth stocks in emerging markets.',
    type: 'stocks',
    country: 'Global',
    targetAmount: 2000000,
    raisedAmount: 1750000,
    imageUrl:
      'https://images.unsplash.com/photo-1579546926623-e3c22ad98954?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    expectedReturn: 'Average 10-15% annually',
  },
  {
    
    title: 'Agricultural Land in Brazil',
    description:
      'Invest in fertile agricultural land in Brazil, with potential for high returns in the growing food sector.',
    type: 'real estate',
    country: 'Brazil',
    targetAmount: 1200000,
    raisedAmount: 900000,
    imageUrl:
      'https://images.unsplash.com/photo-1584818156312-177112459779?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    expectedReturn: '9% - 11% annually',
  },
  {
   
    title: 'Sustainable Urban Development',
    description: 'Invest in the future of eco-friendly urban living. Project focuses on green technologies and sustainable practices.',
    type: 'real estate',
    country: 'Singapore',
    targetAmount: 1500000,
    raisedAmount: 850000,
    imageUrl: 'https://images.unsplash.com/photo-1541963235-95dd9e552594?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    expectedReturn: '10% - 14% annually'
  },
  {
   
    title: 'Global E-commerce Platform',
    description: 'Invest in a rapidly expanding e-commerce platform with a global reach and a focus on innovative shopping experiences.',
    type: 'startup',
    country: 'Canada',
    targetAmount: 800000,
    raisedAmount: 600000,
    imageUrl: 'https://images.unsplash.com/photo-1580476262700-c55a45462564?q=80&w=3174&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    expectedReturn: 'Potential for 8x return in 4 years'
  },
  {
    
    title: 'Infrastructure Project in Africa',
    description:
      'Invest in critical infrastructure development in Africa, supporting economic growth and community development.',
    type: 'real estate',
    country: 'Nigeria',
    targetAmount: 2500000,
    raisedAmount: 2100000,
    imageUrl:
      'https://images.unsplash.com/photo-1600804340584-c7db2e501694?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    expectedReturn: 'Stable, long-term returns expected',
  },
];

const prisma = new PrismaClient();

export async function saveseedPortfolios() {
  try {
    const deleteResult = await prisma.investmentPortfolio.deleteMany({});
    console.log(`Successfully deleted ${deleteResult.count} existing portfolia records.`);

    const createManyResult = await prisma.investmentPortfolio.createMany({
      data: seedPortfolios,
    });

    console.log(`Successfully created ${createManyResult.count} initial seeds portifolios records.`);
  } catch (error) {
    console.error('Error saving initial jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}
