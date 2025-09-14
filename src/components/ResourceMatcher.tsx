import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Download, Share2, Phone, Mail, Globe, DollarSign, Users, Briefcase, Heart, Star, MapPin, CheckCircle, ExternalLink, FileText, Lightbulb } from 'lucide-react';
import Header from './Header';
import { UserProfile, Resource } from '../App';

interface ResourceMatcherProps {
  profile: UserProfile;
  resources: Resource[];
  onBack: () => void;
  onRestart: () => void;
}

const ResourceMatcher: React.FC<ResourceMatcherProps> = ({ profile, resources, onBack, onRestart }) => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showApplicationDraft, setShowApplicationDraft] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'funding':
        return DollarSign;
      case 'program':
        return Users;
      case 'job':
        return Briefcase;
      case 'support':
        return Heart;
      default:
        return Users;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'funding':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'program':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'job':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'support':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredResources = filterType === 'all' 
    ? resources 
    : resources.filter(resource => resource.type === filterType);

  const generateApplicationDraft = (resource: Resource) => {
    const isJobApplication = resource.type === 'job';
    
    if (isJobApplication) {
      return `Subject: Application for ${resource.name}

Dear Hiring Manager,

I am writing to express my interest in the ${resource.name} opportunity. Based on my profile assessment, I believe I would be a strong fit for this role.

About me:
• Name: ${profile.personalInfo.name}
• Location: ${profile.personalInfo.location}
• Educational Background: ${profile.education.level}
• Key Skills: ${profile.education.skills.slice(0, 5).join(', ')}
• Areas of Interest: ${profile.education.interests.slice(0, 3).join(', ')}

I am particularly interested in this opportunity because it aligns with my goal of ${profile.needs.priority.toLowerCase()}. I have experience with ${profile.employment.history || 'various relevant activities'} and am eager to contribute to your team.

I would appreciate workplace accommodations including: ${profile.employment.workPreferences.slice(0, 3).join(', ')}.

I am available for an interview at your convenience and look forward to hearing from you.

Best regards,
${profile.personalInfo.name}`;
    } else {
      return `Subject: Application for ${resource.name}

Dear Application Review Team,

I am writing to apply for support through the ${resource.name}. I believe I meet the eligibility criteria and would greatly benefit from this program.

Personal Details:
• Name: ${profile.personalInfo.name}
• Location: ${profile.personalInfo.location}
• Disability Type: ${profile.disability.type.join(', ')}
• Current Priority: ${profile.needs.priority}

My situation:
${profile.disability.description || 'I am seeking support to improve my independence and quality of life.'}

Specific needs:
• ${profile.needs.financial.slice(0, 3).join('\n• ')}

This support would help me achieve my goal of ${profile.needs.priority.toLowerCase()} and improve my overall independence.

I have attached all required documentation and am available to provide additional information as needed.

Thank you for your consideration.

Sincerely,
${profile.personalInfo.name}`;
    }
  };

  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const Icon = getTypeIcon(resource.type);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg border ${getTypeColor(resource.type)}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{resource.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(resource.type)}`}>
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                  </span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{resource.relevanceScore}% match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{resource.description}</p>

          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Benefits:</h4>
            <p className="text-gray-700 text-sm">{resource.benefits}</p>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Eligibility:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {resource.eligibility.map((criteria, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {criteria}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center text-sm text-gray-600 mb-4">
            <MapPin className="w-4 h-4 mr-1" />
            {resource.location}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedResource(resource)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Details
            </button>
            {resource.contactInfo.website && (
              <a
                href={resource.contactInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Visit website"
              >
                <ExternalLink className="w-5 h-5 text-gray-600" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ResourceModal = ({ resource }: { resource: Resource }) => {
    if (!resource) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg border ${getTypeColor(resource.type)}`}>
                  {React.createElement(getTypeIcon(resource.type), { className: "w-6 h-6" })}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{resource.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getTypeColor(resource.type)}`}>
                      {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                    </span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{resource.relevanceScore}% match</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{resource.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Benefits</h3>
              <p className="text-gray-700">{resource.benefits}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eligibility Criteria</h3>
              <ul className="space-y-2">
                {resource.eligibility.map((criteria, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Steps</h3>
              <ol className="space-y-2">
                {resource.applicationSteps.map((step, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-3">
                {resource.contactInfo.website && (
                  <a
                    href={resource.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Globe className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-blue-600 font-medium">Visit Website</span>
                    <ExternalLink className="w-4 h-4 text-blue-600 ml-2" />
                  </a>
                )}
                {resource.contactInfo.phone && (
                  <a
                    href={`tel:${resource.contactInfo.phone}`}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-gray-700">{resource.contactInfo.phone}</span>
                  </a>
                )}
                {resource.contactInfo.email && (
                  <a
                    href={`mailto:${resource.contactInfo.email}`}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-gray-700">{resource.contactInfo.email}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowApplicationDraft(true)}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <FileText className="w-5 h-5 mr-2" />
                Generate Application Draft
              </button>
              <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ApplicationDraftModal = () => {
    if (!selectedResource) return null;

    const draftContent = generateApplicationDraft(selectedResource);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Application Draft</h2>
                  <p className="text-gray-600">For {selectedResource.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplicationDraft(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 font-medium">Tip</p>
              </div>
              <p className="text-yellow-700 mt-1 text-sm">
                This is a personalized draft based on your profile. Please review and customize it before submitting.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {draftContent}
              </pre>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => navigator.clipboard.writeText(draftContent)}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                Copy to Clipboard
              </button>
              <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your Personalized Recommendations
            </h2>
            <p className="text-xl text-gray-700 mb-6">
              We found {resources.length} opportunities specifically matched to your profile
            </p>
            
            {/* Summary stats */}
            <div className="grid md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{resources.filter(r => r.type === 'funding').length}</div>
                <div className="text-sm text-gray-600">Funding Sources</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{resources.filter(r => r.type === 'program').length}</div>
                <div className="text-sm text-gray-600">Programs</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{resources.filter(r => r.type === 'job').length}</div>
                <div className="text-sm text-gray-600">Job Opportunities</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-red-600">{resources.filter(r => r.type === 'support').length}</div>
                <div className="text-sm text-gray-600">Support Services</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter by Type</h3>
              <div className="text-sm text-gray-600">
                Showing {filteredResources.length} of {resources.length} resources
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'all', label: 'All Resources', icon: Heart },
                { value: 'funding', label: 'Funding', icon: DollarSign },
                { value: 'program', label: 'Programs', icon: Users },
                { value: 'job', label: 'Jobs', icon: Briefcase },
                { value: 'support', label: 'Support', icon: Heart }
              ].map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setFilterType(filter.value)}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === filter.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resources grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Users className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors"
            >
              <ArrowLeft className="mr-2 w-5 h-5" />
              Back to Assessment
            </button>

            <button
              onClick={onRestart}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="mr-2 w-5 h-5" />
              Start New Assessment
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      {selectedResource && !showApplicationDraft && (
        <ResourceModal resource={selectedResource} />
      )}
      {showApplicationDraft && <ApplicationDraftModal />}
    </div>
  );
};

export default ResourceMatcher;