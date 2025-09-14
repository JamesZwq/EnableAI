import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, User, Heart, Target, Briefcase, Clock } from 'lucide-react';
import Header from './Header';
import { UserProfile, Resource } from '../App';

interface AssessmentResultsProps {
  profile: UserProfile;
  onComplete: (resources: Resource[]) => void;
  onBack: () => void;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({ profile, onComplete, onBack }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const analysisSteps = [
    { text: 'Analyzing your profile...', icon: User },
    { text: 'Identifying your needs...', icon: Heart },
    { text: 'Matching eligibility criteria...', icon: Target },
    { text: 'Finding opportunities...', icon: Briefcase },
    { text: 'Generating recommendations...', icon: CheckCircle }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        } else {
          setIsAnalyzing(false);
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const generateResources = (): Resource[] => {
    const resources: Resource[] = [];
    
    // Government Programs
    if (profile.disability.type.length > 0) {
      resources.push({
        id: '1',
        name: 'National Disability Insurance Scheme (NDIS)',
        type: 'program',
        description: 'Provides funding and support for people with permanent and significant disabilities',
        eligibility: ['Under 65', 'Australian resident', 'Permanent disability'],
        benefits: 'Funding for supports, assistive technology, and capacity building',
        applicationSteps: [
          'Check eligibility criteria',
          'Gather medical evidence',
          'Complete application form',
          'Submit to NDIS office',
          'Attend planning meeting'
        ],
        contactInfo: {
          website: 'https://www.ndis.gov.au',
          phone: '1800 800 110'
        },
        relevanceScore: 95,
        location: profile.personalInfo.location
      });
    }

    // Employment programs
    if (profile.employment.interests.length > 0) {
      resources.push({
        id: '2',
        name: 'Disability Employment Services (DES)',
        type: 'program',
        description: 'Helps people with disabilities find and keep a job',
        eligibility: ['Have a disability', 'Registered with Centrelink', 'Looking for work'],
        benefits: 'Job matching, workplace modifications, ongoing support',
        applicationSteps: [
          'Register with Centrelink',
          'Get medical evidence',
          'Find a DES provider',
          'Attend assessment',
          'Start job search support'
        ],
        contactInfo: {
          website: 'https://www.dese.gov.au/disability-employment-services',
          phone: '132 850'
        },
        relevanceScore: 90,
        location: profile.personalInfo.location
      });
    }

    // Financial support
    if (profile.needs.financial.includes('Disability pension')) {
      resources.push({
        id: '3',
        name: 'Disability Support Pension',
        type: 'funding',
        description: 'Financial support for people who cannot work due to disability',
        eligibility: ['Permanent disability', 'Unable to work', 'Meet income/asset tests'],
        benefits: 'Fortnightly payments, health care card, rental assistance',
        applicationSteps: [
          'Check eligibility online',
          'Gather medical evidence',
          'Complete claim form',
          'Submit to Centrelink',
          'Attend medical assessment if required'
        ],
        contactInfo: {
          website: 'https://www.servicesaustralia.gov.au/disability-support-pension',
          phone: '132 717'
        },
        relevanceScore: 85,
        location: profile.personalInfo.location
      });
    }

    // Technology funding
    if (profile.needs.financial.includes('Assistive technology')) {
      resources.push({
        id: '4',
        name: 'Equipment and Technology Grants',
        type: 'funding',
        description: 'Funding for assistive technology and equipment',
        eligibility: ['Have a disability', 'Technology improves independence', 'Australian resident'],
        benefits: 'Up to $10,000 for assistive technology',
        applicationSteps: [
          'Get assessment from OT or specialist',
          'Obtain quotes for equipment',
          'Complete application form',
          'Submit supporting documents',
          'Wait for approval'
        ],
        contactInfo: {
          website: 'https://www.icannetwork.com.au/grants',
          phone: '1800 422 622'
        },
        relevanceScore: 80,
        location: profile.personalInfo.location
      });
    }

    // Job opportunities based on interests and skills
    if (profile.education.interests.includes('Technology')) {
      resources.push({
        id: '5',
        name: 'Inclusive Tech Careers Program',
        type: 'job',
        description: 'Technology roles with accessibility-focused companies',
        eligibility: ['Interest in technology', 'Basic computer skills', 'Willingness to learn'],
        benefits: 'Remote work options, assistive technology provided, career progression',
        applicationSteps: [
          'Complete skills assessment',
          'Update resume',
          'Apply online',
          'Attend virtual interview',
          'Complete skills training if offered'
        ],
        contactInfo: {
          website: 'https://www.example-inclusive-tech.com',
          email: 'careers@inclusive-tech.com'
        },
        relevanceScore: 75,
        location: 'Remote/Australia-wide'
      });
    }

    // Education funding
    if (profile.needs.financial.includes('Training/Education funding')) {
      resources.push({
        id: '6',
        name: 'Vocational Rehabilitation Program',
        type: 'program',
        description: 'Funding for training and education to improve job prospects',
        eligibility: ['Have a disability', 'Want to work or return to work', 'Training improves employment prospects'],
        benefits: 'Course fees, materials, travel allowance, income support',
        applicationSteps: [
          'Contact rehabilitation counselor',
          'Develop rehabilitation plan',
          'Choose approved course',
          'Apply for funding',
          'Start training'
        ],
        contactInfo: {
          website: 'https://www.jobaccess.gov.au',
          phone: '1800 464 800'
        },
        relevanceScore: 70,
        location: profile.personalInfo.location
      });
    }

    return resources.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const handleContinue = () => {
    const resources = generateResources();
    onComplete(resources);
  };

  const ProfileSummary = () => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Your Profile Summary</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
          <ul className="text-gray-700 space-y-1">
            <li>Name: {profile.personalInfo.name}</li>
            <li>Location: {profile.personalInfo.location}</li>
            <li>Communication: {profile.personalInfo.communicationMode}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Disability Profile</h4>
          <ul className="text-gray-700 space-y-1">
            {profile.disability.type.map((type, index) => (
              <li key={index}>• {type}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Skills & Education</h4>
          <ul className="text-gray-700 space-y-1">
            <li>Education: {profile.education.level}</li>
            <li>Skills: {profile.education.skills.slice(0, 3).join(', ')}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Goals & Needs</h4>
          <ul className="text-gray-700 space-y-1">
            <li>Priority: {profile.needs.priority}</li>
            <li>Employment: {profile.employment.interests.slice(0, 2).join(', ')}</li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Profile</h2>
                <p className="text-gray-600">We're finding the best resources and opportunities for you...</p>
              </div>

              <div className="space-y-4">
                {analysisSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <div key={index} className={`flex items-center p-4 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-blue-50 border-2 border-blue-200' 
                        : isCompleted 
                          ? 'bg-green-50 border-2 border-green-200'
                          : 'bg-gray-50 border-2 border-gray-100'
                    }`}>
                      <div className={`p-2 rounded-full mr-4 ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : isCompleted 
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-300 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                        )}
                      </div>
                      <span className={`font-medium ${
                        isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.text}
                      </span>
                      {isActive && (
                        <div className="ml-auto">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Complete!</h2>
            <p className="text-xl text-gray-700">
              We've identified several opportunities and resources that match your profile
            </p>
          </div>

          <ProfileSummary />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to See Your Personalized Recommendations?
            </h3>
            <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
              Based on your profile, we've found funding sources, government programs, and job opportunities 
              that are specifically relevant to your needs and goals.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{generateResources().filter(r => r.type === 'funding').length}</div>
                <div className="text-gray-600">Funding Sources</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{generateResources().filter(r => r.type === 'program').length}</div>
                <div className="text-gray-600">Government Programs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{generateResources().filter(r => r.type === 'job').length}</div>
                <div className="text-gray-600">Job Opportunities</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors"
              >
                <ArrowLeft className="mr-2 w-5 h-5" />
                Back to Profile
              </button>

              <button
                onClick={handleContinue}
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                View My Recommendations
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessmentResults;