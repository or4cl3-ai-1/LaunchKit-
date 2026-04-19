import { BusinessIdea } from "../types";

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  idea: BusinessIdea;
  vibe: string;
}

export const QUICK_START_TEMPLATES: Template[] = [
  {
    id: 'saas',
    name: 'SaaS Platform',
    description: 'A subscription-based software business.',
    icon: '💻',
    vibe: 'tech',
    idea: {
      problem: 'Small businesses struggle to manage their social media presence across multiple platforms, leading to inconsistent branding and missed engagement opportunities.',
      solution: 'An AI-powered social media dashboard that automates content scheduling, generates post ideas, and provides unified analytics for all major platforms.',
      targetAudience: 'Small business owners, solo entrepreneurs, and boutique marketing agencies.',
      pricingStrategy: 'Tiered subscription model: $29/mo for Basic (3 profiles), $79/mo for Pro (10 profiles + AI features), and $199/mo for Agency (unlimited).',
      marketingChannels: 'Content marketing via a blog on social media strategy, targeted LinkedIn ads, and partnerships with business influencers.'
    }
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Store',
    description: 'A direct-to-consumer online retail brand.',
    icon: '🛍️',
    vibe: 'luxury',
    idea: {
      problem: 'Eco-conscious consumers find it difficult to find high-quality, stylish home decor that is sustainably sourced and ethically manufactured.',
      solution: 'A curated online marketplace for premium, sustainable home goods, featuring artisan-made products with transparent supply chains.',
      targetAudience: 'Millennials and Gen Z professionals who prioritize sustainability and aesthetics in their home environment.',
      pricingStrategy: 'Premium markup on curated goods, with an average order value of $150. Loyalty program for repeat customers.',
      marketingChannels: 'Instagram and Pinterest visual marketing, influencer collaborations in the home decor space, and SEO-optimized gift guides.'
    }
  },
  {
    id: 'local-services',
    name: 'Local Service Business',
    description: 'A service-based business for a specific area.',
    icon: '🛠️',
    vibe: 'minimal',
    idea: {
      problem: 'Homeowners in suburban areas often face long wait times and unreliable service when trying to book routine HVAC maintenance and repairs.',
      solution: 'A tech-enabled HVAC service company that offers 24/7 online booking, transparent flat-rate pricing, and real-time technician tracking.',
      targetAudience: 'Homeowners in the Greater Metro area who value reliability, speed, and modern convenience.',
      pricingStrategy: 'Flat-rate service calls ($99), annual maintenance memberships ($199/year), and quoted project work for installs.',
      marketingChannels: 'Local SEO (Google Business Profile), targeted Facebook ads for local zip codes, and neighborhood referral programs.'
    }
  }
];
