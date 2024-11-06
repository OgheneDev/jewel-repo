import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  addDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Send, ArrowLeft, Menu } from 'lucide-react';

const MessageSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-start space-x-2 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

const AdminChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobileViewingChat, setIsMobileViewingChat] = useState(false)

  // Fetch all chats (users who have started conversations)
  useEffect(() => {
    const fetchChats = () => {
      const q = query(collection(db, 'chats'), orderBy('lastUpdated', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedChats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(fetchedChats);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchChats();
    return () => unsubscribe();
  }, []);

  // Fetch messages for the selected chat
  useEffect(() => {
    if (!selectedChat) return;

    setLoading(true);
    const fetchMessages = () => {
      const messagesRef = collection(db, 'chats', selectedChat.id, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => doc.data());
        setMessages(fetchedMessages);
        setLoading(false);

        // Reset unreadCount to 0 when admin reads the messages
        const chatRef = doc(db, 'chats', selectedChat.id);
        setDoc(chatRef, { unreadCount: 0 }, { merge: true })
          .catch(error => console.error('Error resetting unread count:', error));
      });

      return unsubscribe;
    };

    const unsubscribe = fetchMessages();
    return () => unsubscribe();
  }, [selectedChat]);

  // Handle sending a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    try {
      const messageData = {
        text: message.trim(),
        sender: 'Admin',
        timestamp: serverTimestamp(),
      };

      // Add the new message
      await addDoc(
        collection(db, 'chats', selectedChat.id, 'messages'), 
        messageData
      );

      // Update chat metadata
      await setDoc(
        doc(db, 'chats', selectedChat.id), 
        {
          lastUpdated: serverTimestamp(),
          unreadCount: 0,
        }, 
        { merge: true }
      );

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setIsMobileViewingChat(true);
  };

  const handleBackToList = () => {
    setIsMobileViewingChat(false);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp?.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleTimeString();
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar - Chat List */}
      <div 
        className={`
          w-full md:w-80 bg-white border-r border-gray-200
          ${isMobileViewingChat ? 'hidden md:block' : 'block'}
        `}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-full">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="divide-y divide-gray-100 overflow-y-auto h-[calc(100vh-64px)]">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors duration-200
                ${selectedChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-500 font-semibold">
                  {(chat.userName || 'A')[0].toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {chat.userName || 'Anonymous'}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatDate(chat.lastUpdated)}
                  </span>
                </div>
                {chat.lastMessage && (
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {chat.lastMessage}
                  </p>
                )}
              </div>
              {chat.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-blue-500 rounded-full">
                  {chat.unreadCount}
                </span>
              )}
            </button>
          ))}
          
          {chats.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div 
        className={`
          flex-1 flex flex-col bg-gray-50
          ${isMobileViewingChat ? 'block' : 'hidden md:block'}
        `}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
              <div className="p-4 flex items-center space-x-4">
                <button 
                  onClick={handleBackToList}
                  className="md:hidden p-1 -ml-1 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-500 font-semibold">
                      {(selectedChat.userName || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedChat.userName || 'Anonymous'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedChat.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loading ? (
                <MessageSkeleton />
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No messages yet
                    </div>
                  )}
                  
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${
                        msg.sender === 'Admin' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-lg p-3 ${
                          msg.sender === 'Admin'
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.text}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={sendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-500">
                Select a conversation to start messaging
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Choose from the list of conversations on the left
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
