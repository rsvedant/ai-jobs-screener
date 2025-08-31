"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: "🎤",
      title: "Voice-First Screening",
      description: "AI-powered voice interviews that assess communication skills, technical knowledge, and cultural fit in natural conversations."
    },
    {
      icon: "⚡",
      title: "Instant Assessment",
      description: "Real-time transcript analysis and automated scoring based on industry-specific criteria and safety awareness."
    },
    {
      icon: "🎯",
      title: "Trade-Specific Evaluation",
      description: "Tailored assessments for construction, electrical, plumbing, welding, manufacturing, and maintenance roles."
    },
    {
      icon: "📊",
      title: "Comprehensive Analytics",
      description: "Detailed candidate insights including technical skills, experience validation, and communication assessment."
    },
    {
      icon: "🔒",
      title: "Secure & Compliant",
      description: "Enterprise-grade security with GDPR compliance and encrypted voice data handling."
    },
    {
      icon: "⚙️",
      title: "Seamless Integration",
      description: "Easy integration with existing HR systems and ATS platforms for streamlined workflows."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director at BuildCorp",
      content: "Reduced our screening time by 75% while improving candidate quality. The voice interviews reveal so much more than traditional applications."
    },
    {
      name: "Mike Rodriguez",
      role: "Talent Acquisition, ElectriTech",
      content: "Finally, a screening tool that understands blue-collar roles. The technical assessments are spot-on for electrical positions."
    },
    {
      name: "Lisa Chen",
      role: "Operations Manager, WeldPro",
      content: "The safety assessment feature is incredible. We can identify safety-conscious candidates before they even step on-site."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VS</span>
              </div>
              <span className="text-xl font-bold text-gray-900">VoiceScreen AI</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/interview" className="text-gray-600 hover:text-blue-600 transition-colors">
                Try Demo
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link 
                href="/interview" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              AI-Powered
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Voice Screening</span>
              <br />for Blue-Collar Jobs
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Transform your hiring process with intelligent voice interviews that assess technical skills, 
              safety awareness, and communication abilities in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/interview"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Start Free Interview 🎤
              </Link>
              <Link 
                href="/dashboard"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-200"
              >
                View Dashboard 📊
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-indigo-200 rounded-full opacity-50 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-12 h-12 bg-purple-200 rounded-full opacity-50 animate-pulse delay-2000"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose VoiceScreen AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Purpose-built for blue-collar industries with advanced AI that understands the unique requirements of skilled trades.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  hoveredFeature === index
                    ? 'border-blue-500 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 transform scale-105'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, efficient, and effective. Get from application to assessment in minutes, not days.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Candidate Joins</h3>
              <p className="text-gray-600 leading-relaxed">
                Candidates receive a simple link to start their voice interview. No apps to download, no complex setup required.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Interviewer</h3>
              <p className="text-gray-600 leading-relaxed">
                Our specialized AI conducts natural conversations, asking trade-specific questions and assessing responses in real-time.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Instant Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive assessment reports are generated immediately, complete with scoring and recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Industry Leaders
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
                <div className="text-blue-600 text-4xl mb-4">"</div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  {testimonial.content}
                </p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-blue-100 mb-12">
            Join hundreds of companies already using VoiceScreen AI to find the best blue-collar talent faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/interview"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Try Free Demo Interview 🚀
            </Link>
            <Link 
              href="/dashboard"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              View Live Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">VS</span>
                </div>
                <span className="text-xl font-bold">VoiceScreen AI</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                The future of blue-collar hiring. AI-powered voice interviews that understand skilled trades.
              </p>
              <div className="text-gray-400 text-sm">
                © 2025 VoiceScreen AI. Built for the VibeCode Hackathon.
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/interview" className="hover:text-white transition-colors">Voice Interview</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><span className="cursor-not-allowed opacity-50">Analytics</span></li>
                <li><span className="cursor-not-allowed opacity-50">Integrations</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Industries</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Construction</li>
                <li>Electrical</li>
                <li>Plumbing</li>
                <li>Welding</li>
                <li>Manufacturing</li>
                <li>Maintenance</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}