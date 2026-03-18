'use client';

import { Inter } from 'next/font/google';
import { CheckIcon, ClockIcon, BellIcon, ShareIcon, ChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-950/80 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-gray-900 font-bold" />
              </div>
              <span className="ml-3 text-xl font-bold">TestMark</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a>
            </nav>
            <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
              Smart bookmark testing
              <br />
              for developers
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              TestMark automatically tests your bookmarked URLs and alerts you when they break. 
              Never let a broken bookmark slow down your workflow again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105">
                Start Free Trial
              </button>
              <button className="border border-gray-600 text-gray-300 px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-500 hover:text-white transition-all duration-200">
                Watch Demo
              </button>
            </div>
            <p className="text-gray-500 mt-4">Free plan includes 25 bookmarks • No credit card required</p>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300">api.staging.dev</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-300">docs.internal.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300">test.myapp.io</span>
                  </div>
                </div>
                <div className="text-center">
                  <ClockIcon className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                  <p className="text-gray-400">Checking every 5 minutes</p>
                </div>
                <div className="text-center">
                  <BellIcon className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                  <p className="text-gray-400">Instant alerts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built for developers who care about uptime
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Unlike generic monitors, TestMark integrates with your actual workflow and the URLs you use daily
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-fade-in-up">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <CheckIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Browser Integration</h3>
              <p className="text-gray-400">Import bookmarks directly from Chrome, Firefox, or Safari. No manual URL entry required.</p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Monitoring</h3>
              <p className="text-gray-400">Checks range from every 5 minutes to hourly. Get alerted before your team notices issues.</p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <ShareIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Team Collaboration</h3>
              <p className="text-gray-400">Share bookmark collections with your team. Everyone stays updated on critical endpoints.</p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Response Analytics</h3>
              <p className="text-gray-400">Track response times, uptime percentages, and historical performance data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How TestMark works
            </h2>
            <p className="text-xl text-gray-300">Get started in under 2 minutes</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4">Import Your Bookmarks</h3>
              <p className="text-gray-300 text-lg">
                Connect your browser or manually add the URLs you want to monitor. TestMark instantly recognizes staging environments, APIs, and documentation links.
              </p>
            </div>
            
            <div className="text-center animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4">Automated Testing</h3>
              <p className="text-gray-300 text-lg">
                TestMark continuously monitors your bookmarks, checking for broken links, slow responses, and server errors. All happens in the background.
              </p>
            </div>
            
            <div className="text-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4">Get Instant Alerts</h3>
              <p className="text-gray-300 text-lg">
                Receive notifications via email, Slack, or Discord the moment something breaks. Fix issues before they impact your workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, developer-friendly pricing
            </h2>
            <p className="text-xl text-gray-300 mb-8">Start free, upgrade when you need more</p>
            
            <div className="flex justify-center mb-8">
              <div className="bg-gray-800 p-1 rounded-lg flex">
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                    activeTab === 'monthly'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setActiveTab('yearly')}
                  className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                    activeTab === 'yearly'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Yearly (20% off)
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-gray-400 mb-6">Perfect for individual developers</p>
              <div className="text-4xl font-bold mb-8">$0<span className="text-xl text-gray-400 font-normal">/month</span></div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Monitor up to 25 bookmarks</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Check every 60 minutes</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Email alerts</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Basic response time tracking</span>
                </li>
              </ul>
              
              <button className="w-full border border-gray-600 text-gray-300 py-3 rounded-lg font-semibold hover:border-gray-500 hover:text-white transition-all duration-200">
                Get Started Free
              </button>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-8 rounded-2xl border border-emerald-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-cyan-500 text-white px-4 py-1 text-sm font-semibold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-gray-400 mb-6">For teams and power users</p>
              <div className="text-4xl font-bold mb-8">
                ${activeTab === 'monthly' ? '9' : '7'}
                <span className="text-xl text-gray-400 font-normal">/month</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Unlimited bookmarks</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Check every 5 minutes</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Team sharing & collaboration</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Slack & Discord webhooks</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Advanced response time tracking</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-emerald-400 mr-3" />
                  <span>Priority support</span>
                </li>
              </ul>
              
              <button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200">
                Start Pro Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently asked questions
            </h2>
          </div>
          
          <div className="space-y-8">
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-3">How is TestMark different from other uptime monitors?</h3>
              <p className="text-gray-300">
                TestMark integrates directly with your browser bookmarks and focuses on the URLs you actually use in your daily workflow. Instead of monitoring random websites, it monitors your staging environments, API endpoints, and documentation that you've bookmarked for a reason.
              </p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-3">Can I import bookmarks from multiple browsers?</h3>
              <p className="text-gray-300">
                Yes! TestMark supports Chrome, Firefox, Safari, and Edge. You can import from multiple browsers and organize them into different collections for different projects or teams.
              </p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-3">What happens when a bookmark breaks?</h3>
              <p className="text-gray-300">
                You'll receive an instant notification via your preferred channel (email, Slack, Discord). The alert includes the specific error (404, 500, timeout), response time data, and a direct link to investigate the issue.
              </p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-3">How does team sharing work?</h3>
              <p className="text-gray-300">
                With Pro plans, you can create shared bookmark collections that your entire team can access. Everyone gets notifications when shared bookmarks go down, ensuring no one misses critical issues.
              </p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-3">Is there an API for custom integrations?</h3>
              <p className="text-gray-300">
                Yes! Pro users get access to our REST API for adding bookmarks programmatically, retrieving status data, and integrating TestMark into your existing DevOps workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                  <CheckIcon className="w-5 h-5 text-gray-900 font-bold" />
                </div>
                <span className="ml-3 text-xl font-bold">TestMark</span>
              </div>
              <p className="text-gray-400">
                Smart bookmark testing for developers and QA teams.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2024 TestMark. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.3s both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out both;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}