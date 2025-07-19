import { Link } from 'react-router-dom';
import { MessageCircle, Shield, Users, Zap } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <header className="relative z-10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white">AgentChat</span>
          </div>
          <nav className="flex space-x-6">
            <Link
              to="/agent/auth"
              className="px-4 py-2 text-white hover:text-gray-300 transition-colors"
            >
              Agent Login
            </Link>
            <Link
              to="/user/chat"
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Start Chat
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
            Real-time
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-white">
              Agent Chat
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Connect users with agents seamlessly. Agents authenticate to go live, 
            users can chat instantly. Experience real-time communication at its finest.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/user/chat"
              className="px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 font-semibold text-lg"
            >
              Start Chatting
            </Link>
            <Link
              to="/agent/auth"
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-black transition-all transform hover:scale-105 font-semibold text-lg"
            >
              Agent Access
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-gray-800">
            <Shield className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Secure Authentication</h3>
            <p className="text-gray-400">Agents must authenticate before going live. Secure JWT-based authentication system.</p>
          </div>
          
          <div className="text-center p-8 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-gray-800">
            <Zap className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Updates</h3>
            <p className="text-gray-400">Instant status updates when agents come online or go offline. Lightning-fast messaging.</p>
          </div>
          
          <div className="text-center p-8 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-gray-800">
            <Users className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Easy User Access</h3>
            <p className="text-gray-400">Users can join and chat immediately without any authentication or setup required.</p>
          </div>
        </div>
      </main>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default LandingPage;