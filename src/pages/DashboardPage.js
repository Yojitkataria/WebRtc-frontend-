import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartWhiteboard = () => {
    // TODO: Implement whiteboard functionality
    alert('Whiteboard feature coming soon!');
  };

  const handleStartVideoCall = () => {
    // TODO: Implement WebRTC video call functionality
    alert('Video call feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                WebRTC Collaboration Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ready to collaborate? Choose your preferred tool to get started with your team.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Whiteboard Card */}
          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Interactive Whiteboard
              </h3>
              <p className="text-gray-600 mb-6">
                Create, draw, and collaborate in real-time with your team on an interactive whiteboard.
                Perfect for brainstorming sessions and presentations.
              </p>
              <Button
                onClick={handleStartWhiteboard}
                className="w-full"
                size="lg"
              >
                Start Whiteboard
              </Button>
            </div>
          </Card>

          {/* Video Call Card */}
          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Video Call
              </h3>
              <p className="text-gray-600 mb-6">
                Connect with your team through high-quality video calls with crystal clear audio.
                Share your screen and collaborate seamlessly.
              </p>
              <Button
                onClick={handleStartVideoCall}
                className="w-full"
                size="lg"
              >
                Start Video Call
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-12 max-w-4xl mx-auto">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">
                  You joined the platform successfully
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  Just now
                </span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">
                  Ready to start your first collaboration session
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  1 min ago
                </span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 