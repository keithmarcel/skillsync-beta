import type { Meta, StoryObj } from '@storybook/react'
import { FeaturedJobCardV2 } from './featured-job-card-v2'

const meta = {
  title: 'Components/FeaturedJobCardV2',
  component: FeaturedJobCardV2,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeaturedJobCardV2>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: '1',
    title: 'Mechanical Assistant Project Manager',
    category: 'Skilled Trades',
    jobType: 'Full-Time',
    skillsCount: 5,
    description: 'Work directly with senior managers to oversee all business aspects of a project.',
    medianSalary: 66700,
    requiredProficiency: 90,
    companyName: 'Power Design',
    companyLogo: '/companies/power-design.svg',
    detailsHref: '/jobs/1',
  },
}

export const WithoutCompanyLogo: Story = {
  args: {
    id: '2',
    title: 'Software Engineer',
    category: 'Technology',
    jobType: 'Full-Time',
    skillsCount: 8,
    description: 'Build and maintain scalable web applications using modern technologies.',
    medianSalary: 95000,
    requiredProficiency: 85,
    detailsHref: '/jobs/2',
  },
}

export const PartTime: Story = {
  args: {
    id: '3',
    title: 'Marketing Coordinator',
    category: 'Marketing',
    jobType: 'Part-Time',
    skillsCount: 6,
    description: 'Coordinate marketing campaigns and manage social media presence.',
    medianSalary: 48000,
    requiredProficiency: 75,
    companyName: 'Tech Startup',
    companyLogo: '/companies/example-logo.svg',
    detailsHref: '/jobs/3',
  },
}

export const HighSalary: Story = {
  args: {
    id: '4',
    title: 'Senior Data Scientist',
    category: 'Data Science',
    jobType: 'Full-Time',
    skillsCount: 12,
    description: 'Lead data science initiatives and develop machine learning models for business insights.',
    medianSalary: 135000,
    requiredProficiency: 95,
    companyName: 'Fortune 500',
    companyLogo: '/companies/example-logo.svg',
    detailsHref: '/jobs/4',
  },
}

export const LongTitle: Story = {
  args: {
    id: '5',
    title: 'Senior Full Stack Software Engineer with Cloud Infrastructure Experience',
    category: 'Technology',
    jobType: 'Full-Time',
    skillsCount: 15,
    description: 'Design, develop, and deploy enterprise-level applications with a focus on scalability and performance.',
    medianSalary: 125000,
    requiredProficiency: 92,
    companyName: 'Tech Company',
    companyLogo: '/companies/example-logo.svg',
    detailsHref: '/jobs/5',
  },
}
