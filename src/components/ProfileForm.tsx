const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://127.0.0.1:8000';
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Mic, Type, CheckCircle, User, GraduationCap, Briefcase, Heart } from 'lucide-react';
import Header from './Header';
import { UserProfile, Resource } from '../App';
interface ProfileFormProps {
  onComplete: (profile: UserProfile, recommendations: Resource[]) => void;
  onBack: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onComplete, onBack }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    personalInfo: {
      name: '',
      age: '',
      location: '',
      communicationMode: 'text'
    },
    disability: {
      type: [],
      description: '',
      severity: ''
    },
    education: {
      level: '',
      skills: [],
      interests: []
    },
    employment: {
      history: '',
      interests: [],
      workPreferences: []
    },
    needs: {
      financial: [],
      support: [],
      technology: [],
      priority: ''
    }
  });

  const sections = [
    { title: 'Personal Information', icon: User },
    { title: 'Disability Profile', icon: Heart },
    { title: 'Education & Skills', icon: GraduationCap },
    { title: 'Employment Goals', icon: Briefcase },
    { title: 'Support Needs', icon: CheckCircle }
  ];

  const updateProfile = (section: keyof UserProfile, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const toggleArrayValue = (section: keyof UserProfile, field: string, value: string) => {
    setProfile(prev => {
      const currentArray = (prev[section] as any)[field] as string[];
      const newArray = currentArray.includes(value) 
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };
// 假设 UserProfile 是你的类型定义
async function sendProfile(profile: UserProfile) {
  try {
    // Debug log to verify the frontend origin and API base
    console.log('Sending profile to API:', { origin: window.location.origin, API_BASE });
    const response = await fetch(`${API_BASE}/recommend`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('Backend error body:', errText);
      throw new Error(`Failed to submit profile: ${response.status} ${response.statusText}`);
    }

    // FastAPI 返回的是 JSON
    const recommendations = await response.json();
    // 这里可以根据需要处理返回的推荐列表
    return recommendations;
  } catch (error) {
    console.error('提交用户画像时出错:', error);
    // 可以在这里弹提示或返回一个默认值
    return null;
  }
}
  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // Voice input would be implemented here
    setTimeout(() => setIsRecording(false), 3000);
  };

  const canProceed = () => {
    switch (currentSection) {
      case 0:
        return profile.personalInfo.name && profile.personalInfo.location;
      case 1:
        return profile.disability.type.length > 0;
      case 2:
        return profile.education.level;
      case 3:
        return profile.employment.interests.length > 0;
      case 4:
        return profile.needs.priority;
      default:
        return false;
    }
  };

const handleNext = async () => {
  if (currentSection < sections.length - 1) {
    setCurrentSection(currentSection + 1);
  } else {
    try {
      setIsSubmitting(true);
      const recommendations = await sendProfile(profile);
      const safeRecs: Resource[] = Array.isArray(recommendations) ? recommendations : [];
      onComplete(profile, safeRecs);
    } catch (e) {
      console.error('提交失败:', e);
      onComplete(profile, []);
    } finally {
      setIsSubmitting(false);
    }
  }
};
  const PersonalInfoSection = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-lg font-medium text-gray-900 mb-2">
          What's your name?
        </label>
        <input
          type="text"
          id="name"
          value={profile.personalInfo.name}
          onChange={(e) => updateProfile('personalInfo', 'name', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition-colors"
          placeholder="Your preferred name"
          aria-describedby="name-help"
        />
        <p id="name-help" className="mt-1 text-sm text-gray-600">This helps us personalize your experience</p>
      </div>

      <div>
        <label htmlFor="age" className="block text-lg font-medium text-gray-900 mb-2">
          Age (optional)
        </label>
        <input
          type="text"
          id="age"
          value={profile.personalInfo.age}
          onChange={(e) => updateProfile('personalInfo', 'age', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition-colors"
          placeholder="Your age or age range"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-lg font-medium text-gray-900 mb-2">
          Where are you located?
        </label>
        <input
          type="text"
          id="location"
          value={profile.personalInfo.location}
          onChange={(e) => updateProfile('personalInfo', 'location', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition-colors"
          placeholder="City, State or Region"
          aria-describedby="location-help"
        />
        <p id="location-help" className="mt-1 text-sm text-gray-600">This helps us find local resources and programs</p>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          How would you prefer to communicate?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['text', 'audio', 'easy-read', 'sign-language'].map((mode) => (
            <button
              key={mode}
              onClick={() => updateProfile('personalInfo', 'communicationMode', mode)}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                profile.personalInfo.communicationMode === mode
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium capitalize">{mode.replace('-', ' ')}</div>
              <div className="text-sm text-gray-600 mt-1">
                {mode === 'text' && 'Standard text communication'}
                {mode === 'audio' && 'Voice and audio formats'}
                {mode === 'easy-read' && 'Simple, clear language'}
                {mode === 'sign-language' && 'Sign language interpretation'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const DisabilitySection = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          What type of disability or condition do you have? (Select all that apply)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Physical disability',
            'Cognitive disability',
            'Sensory disability (vision)',
            'Sensory disability (hearing)',
            'Mental health condition',
            'Chronic illness',
            'Learning disability',
            'Multiple disabilities',
            'Prefer not to specify'
          ].map((type) => (
            <button
              key={type}
              onClick={() => toggleArrayValue('disability', 'type', type)}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                profile.disability.type.includes(type)
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                {profile.disability.type.includes(type) && (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                )}
                <span className="font-medium">{type}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="disability-description" className="block text-lg font-medium text-gray-900 mb-2">
          Tell us more about your situation (optional)
        </label>
        <div className="relative">
          <textarea
            id="disability-description"
            value={profile.disability.description}
            onChange={(e) => updateProfile('disability', 'description', e.target.value)}
            className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition-colors"
            rows={4}
            placeholder="Share any specific details that might help us find the best resources for you"
          />
          <button
            onClick={handleVoiceInput}
            className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
              isRecording ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
            }`}
            aria-label="Use voice input"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          How would you describe the impact on daily activities?
        </label>
        <div className="space-y-2">
          {[
            { value: 'minimal', label: 'Minimal - I can do most things independently' },
            { value: 'moderate', label: 'Moderate - I need some assistance with certain activities' },
            { value: 'significant', label: 'Significant - I need regular support and assistance' },
            { value: 'varies', label: 'It varies - some days are better than others' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateProfile('disability', 'severity', option.value)}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                profile.disability.severity === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{option.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const EducationSection = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          What's your educational background?
        </label>
        <div className="space-y-2">
          {[
            'Currently in school',
            'High school or equivalent',
            'Vocational training',
            'Some college',
            'Bachelor\'s degree',
            'Graduate degree',
            'Self-taught/Other'
          ].map((level) => (
            <button
              key={level}
              onClick={() => updateProfile('education', 'level', level)}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                profile.education.level === level
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{level}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          What skills do you have? (Select all that apply)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'Communication',
            'Computer skills',
            'Art & creativity',
            'Problem solving',
            'Customer service',
            'Organization',
            'Teaching',
            'Technical skills',
            'Writing',
            'Languages',
            'Mathematics',
            'Research'
          ].map((skill) => (
            <button
              key={skill}
              onClick={() => toggleArrayValue('education', 'skills', skill)}
              className={`p-3 border-2 rounded-xl text-center transition-all ${
                profile.education.skills.includes(skill)
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">{skill}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          What subjects or areas interest you most?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'Technology',
            'Healthcare',
            'Education',
            'Arts & Media',
            'Business',
            'Social Services',
            'Environment',
            'Sports & Recreation',
            'Food & Hospitality',
            'Manufacturing',
            'Transportation',
            'Agriculture'
          ].map((interest) => (
            <button
              key={interest}
              onClick={() => toggleArrayValue('education', 'interests', interest)}
              className={`p-3 border-2 rounded-xl text-center transition-all ${
                profile.education.interests.includes(interest)
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">{interest}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const EmploymentSection = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="employment-history" className="block text-lg font-medium text-gray-900 mb-2">
          Tell us about your work experience (optional)
        </label>
        <textarea
          id="employment-history"
          value={profile.employment.history}
          onChange={(e) => updateProfile('employment', 'history', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition-colors"
          rows={4}
          placeholder="Previous jobs, volunteer work, or any relevant experience"
        />
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          What type of work interests you? (Select all that apply)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Full-time employment',
            'Part-time employment',
            'Freelance/Contract work',
            'Remote work',
            'Supported employment',
            'Entrepreneurship',
            'Volunteer opportunities',
            'Skills training programs'
          ].map((interest) => (
            <button
              key={interest}
              onClick={() => toggleArrayValue('employment', 'interests', interest)}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                profile.employment.interests.includes(interest)
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                {profile.employment.interests.includes(interest) && (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                )}
                <span className="font-medium">{interest}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          What workplace accommodations would be helpful?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Flexible hours',
            'Remote work options',
            'Accessible workspace',
            'Assistive technology',
            'Modified duties',
            'Job coaching',
            'Quiet environment',
            'Regular breaks'
          ].map((preference) => (
            <button
              key={preference}
              onClick={() => toggleArrayValue('employment', 'workPreferences', preference)}
              className={`p-3 border-2 rounded-xl text-center transition-all ${
                profile.employment.workPreferences.includes(preference)
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">{preference}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const NeedsSection = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          What financial support might you need? (Select all that apply)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Disability pension',
            'Training/Education funding',
            'Assistive technology',
            'Healthcare expenses',
            'Transportation support',
            'Housing assistance',
            'Equipment funding',
            'Job training programs'
          ].map((need) => (
            <button
              key={need}
              onClick={() => toggleArrayValue('needs', 'financial', need)}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                profile.needs.financial.includes(need)
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                {profile.needs.financial.includes(need) && (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                )}
                <span className="font-medium">{need}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          What kind of support services would be helpful?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Case management',
            'Career counseling',
            'Skills assessment',
            'Job placement',
            'Peer support',
            'Family support',
            'Transportation',
            'Personal care assistance'
          ].map((support) => (
            <button
              key={support}
              onClick={() => toggleArrayValue('needs', 'support', support)}
              className={`p-3 border-2 rounded-xl text-center transition-all ${
                profile.needs.support.includes(support)
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">{support}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-900 mb-3">
          What's your top priority right now?
        </label>
        <div className="space-y-2">
          {[
            'Finding employment',
            'Getting financial support',
            'Accessing training/education',
            'Obtaining assistive technology',
            'Getting healthcare support',
            'Finding housing assistance',
            'Connecting with support services'
          ].map((priority) => (
            <button
              key={priority}
              onClick={() => updateProfile('needs', 'priority', priority)}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                profile.needs.priority === priority
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{priority}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0:
        return <PersonalInfoSection />;
      case 1:
        return <DisabilitySection />;
      case 2:
        return <EducationSection />;
      case 3:
        return <EmploymentSection />;
      case 4:
        return <NeedsSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Step {currentSection + 1} of {sections.length}: {sections[currentSection].title}
              </h2>
              <div className="text-sm text-gray-600">
                {Math.round(((currentSection + 1) / sections.length) * 100)}% Complete
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Section indicators */}
          <div className="flex items-center justify-center mb-8 space-x-4">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = index === currentSection;
              const isCompleted = index < currentSection;
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`p-3 rounded-full border-2 transition-all ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50 text-blue-600' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-50 text-green-600'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  {index < sections.length - 1 && (
                    <div className={`w-8 h-1 mx-2 transition-all ${
                      isCompleted ? 'bg-green-300' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {renderCurrentSection()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={currentSection === 0 ? onBack : () => setCurrentSection(currentSection - 1)}
              className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors"
            >
              <ArrowLeft className="mr-2 w-5 h-5" />
              {currentSection === 0 ? 'Back to Home' : 'Previous'}
            </button>

<button
  onClick={handleNext}
  disabled={!canProceed() || isSubmitting}
  className={`inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-lg hover:shadow-xl ${
    isSubmitting ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
  }`}
>
  {currentSection < sections.length - 1 ? (
    <>
      Next
      <ArrowRight className="ml-2 w-5 h-5" />
    </>
  ) : (
    <>
      {isSubmitting ? 'Submitting…' : 'Submit & Get Recommendations'}
      <ArrowRight className="ml-2 w-5 h-5" />
    </>
  )}
</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileForm;