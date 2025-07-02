import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInterface from '@/components/chat/ChatInterface';

const ChatPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invalid Session</h2>
          <p className="text-gray-600 mb-4">Session ID not found</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface 
      sessionId={sessionId} 
      onBack={() => navigate('/dashboard')}
    />
  );
};

export default ChatPage;