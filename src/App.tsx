import React, { useState } from 'react';
import { Heart, Users, Briefcase, DollarSign, MapPin, ArrowRight, ArrowLeft, CheckCircle, Star, Phone, Mail, Globe, Accessibility } from 'lucide-react';
import ProfileForm from './components/ProfileForm';
import AssessmentResults from './components/AssessmentResults';
import ResourceMatcher from './components/ResourceMatcher';
import Header from './components/Header';

export interface UserProfile {
  personalInfo: {
    name: string;
    age: string;
    location: string;
    communicationMode: string;
  };
  disability: {
    type: string[];
    description: string;
    severity: string;
  };
  education: {
    level: string;
    skills: string[];
    interests: string[];
  };
  employment: {
    history: string;
    interests: string[];
    workPreferences: string[];
  };
  needs: {
    financial: string[];
    support: string[];
    technology: string[];
    priority: string;
  };
}

export interface Resource {
  id: string;
  name: string;
  type: 'funding' | 'program' | 'job' | 'support';
  description: string;
  eligibility: string[];
  benefits: string;
  applicationSteps: string[];
  contactInfo: {
    website?: string;
    phone?: string;
    email?: string;
  };
  relevanceScore: number;
  location: string;
}

function App() {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'profile' | 'assessment' | 'resources'>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [matchedResources, setMatchedResources] = useState<Resource[]>([]);

  const handleProfileComplete = (profile: UserProfile, recommendations: Resource[]) => {
    setUserProfile(profile);
    setMatchedResources(recommendations || []);
    setCurrentStep('resources'); // 或 'assessment'，看你的流程
  };

  const handleAssessmentComplete = (resources: Resource[]) => {
    setMatchedResources(resources);
    setCurrentStep('resources');
  };

  const resetApplication = () => {
    setCurrentStep('welcome');
    setUserProfile(null);
    setMatchedResources([]);
  };

  const WelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <Heart className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Empowering Your Journey
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with funding opportunities, government programs, and inclusive job placements 
              tailored specifically to your unique needs and aspirations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <DollarSign className="w-12 h-12 text-green-600 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Funding Sources</h3>
              <p className="text-gray-600">Discover grants, subsidies, and financial support programs available to you.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <Users className="w-12 h-12 text-blue-600 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Government Programs</h3>
              <p className="text-gray-600">Access NDIS, training grants, housing support, and disability pensions.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <Briefcase className="w-12 h-12 text-purple-600 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Opportunities</h3>
              <p className="text-gray-600">Find inclusive workplaces and career paths that match your skills.</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentStep('profile')}
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            aria-label="Start your personalized assessment"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>

          <div className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex items-center justify-center mb-4">
              <Accessibility className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Accessibility First</h3>
            </div>
            <p className="text-gray-700">
              This platform is designed with accessibility in mind, supporting screen readers, 
              keyboard navigation, voice input, and multiple communication formats.
            </p>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <>
      {currentStep === 'welcome' && <WelcomeScreen />}
      {currentStep === 'profile' && (
        <ProfileForm 
          onComplete={handleProfileComplete}
          onBack={() => setCurrentStep('welcome')}
        />
      )}
      {currentStep === 'assessment' && userProfile && (
        <AssessmentResults 
          profile={userProfile}
          onComplete={handleAssessmentComplete}
          onBack={() => setCurrentStep('profile')}
        />
      )}
      {currentStep === 'resources' && userProfile && (
        <ResourceMatcher 
          profile={userProfile}
          resources={matchedResources}
          onBack={() => setCurrentStep('assessment')}
          onRestart={resetApplication}
        />
      )}
    </>
  );
}

export default App;