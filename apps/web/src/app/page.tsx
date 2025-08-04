'use client';

import { Background } from '@/components/background';
import { Navigation } from '@/components/navigation';
import { ActionButton } from '@/components/ui/action-button';
import { GlowCard } from '@/components/ui/glow-card';
import { ShimmerBorder } from '@/components/ui/shimmer-border';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Code, Coins, Shield, Users, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: Coins,
    title: 'SPL Token Creation',
    description: 'Create fungible tokens with custom metadata on Solana blockchain',
  },
  {
    icon: Shield,
    title: 'Authority Control',
    description: 'Manage mint and freeze authorities with full control',
  },
  {
    icon: Zap,
    title: 'Instant Deployment',
    description: 'Deploy your token in seconds with our optimized flow',
  },
  {
    icon: Code,
    title: 'Transfer Fees',
    description: 'Configure custom transfer fees and distribution wallets',
  },
  {
    icon: Users,
    title: 'Airdrop Tools',
    description: 'Built-in tools for token distribution and airdrops',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track token performance and holder metrics',
  },
];

const steps = [
  {
    number: '01',
    title: 'Connect Wallet',
    description: 'Connect your Solana wallet to get started',
  },
  {
    number: '02',
    title: 'Configure Token',
    description: 'Set up token details, supply, and authorities',
  },
  {
    number: '03',
    title: 'Upload Metadata',
    description: 'Add your token logo and metadata to IPFS',
  },
  {
    number: '04',
    title: 'Deploy & Launch',
    description: 'Review and deploy your token to Solana',
  },
];

export default function HomePage() {
  const { connected } = useWallet();
  const router = useRouter();

  return (
    <>
      <Background />
      <Navigation />
      
      <main className="relative z-10 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <ShimmerBorder className="inline-block">
                <div className="px-6 py-2 text-sm font-medium text-primary">
                  Launch Your Token on Solana
                </div>
              </ShimmerBorder>
              
              <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
                Create Your Own
                <span className="block text-primary">Solana Token</span>
              </h1>
              
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                Launch SPL tokens with custom metadata, transfer fees, and advanced features. 
                No coding required.
              </p>
              
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                {connected ? (
                  <>
                    <ActionButton
                      size="lg"
                      className="group"
                      onClick={() => router.push('/create')}
                    >
                      Create Token
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </ActionButton>
                    <ActionButton
                      variant="outline"
                      size="lg"
                      onClick={() => router.push('/dashboard')}
                    >
                      Go to Dashboard
                    </ActionButton>
                  </>
                ) : (
                  <>
                    <ActionButton
                      size="lg"
                      className="group"
                      onClick={() => router.push('/create')}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </ActionButton>
                    <ActionButton
                      variant="outline"
                      size="lg"
                      onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Learn More
                    </ActionButton>
                  </>
                )}
              </div>
            </motion.div>
            
            {/* Floating token icons */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-12 w-12 text-primary/20"
                  style={{
                    left: `${(i * 16) + 10}%`,
                    top: `${(i * 15) + 10}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 10 + i * 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <Coins className="h-full w-full" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
              <p className="text-xl text-muted-foreground">
                Powerful features to launch and manage your token
              </p>
            </motion.div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlowCard className="h-full p-6">
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 px-4 bg-card/30">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground">
                Launch your token in four simple steps
              </p>
            </motion.div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                  <div className="text-center">
                    <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <ShimmerBorder className="inline-block">
                <div className="p-12 space-y-6">
                  <h2 className="text-4xl font-bold">Ready to Launch?</h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Join thousands of creators who have launched their tokens on Solana
                  </p>
                  <ActionButton
                    size="lg"
                    className="group"
                    onClick={() => router.push(connected ? '/create' : '/dashboard')}
                  >
                    {connected ? 'Create Your Token' : 'Get Started'}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </ActionButton>
                </div>
              </ShimmerBorder>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
