import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  User,
  Bot,
  Circle,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";

const UserChat = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

  const [username, setUsername] = useState("");
  const [isIdentified, setIsIdentified] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false); // ADDED
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { userSocket, connectUser, disconnectUser } = useSocket();

  useEffect(() => {
    if (userSocket) {
      userSocket.on("userIdentified", (data) => {
        setIsIdentified(true);
        setIsConnecting(false);
        setAgents(data.agents);
        toast.success(`Welcome, ${data.username}!`);
      });

      userSocket.on("agentStatusChanged", (data) => {
        setAgents((prev) => {
          const updated = prev.map((agent) =>
            agent.username === data.username
              ? { ...agent, isOnline: data.isOnline, status: data.status }
              : agent
          );

          if (!updated.find((a) => a.username === data.username)) {
            updated.push({
              id: data.agentId,
              username: data.username,
              isOnline: data.isOnline,
              status: data.status,
            });
          }

          return updated;
        });

        if (data.isOnline) {
          toast.success(`Agent ${data.username} is now live!`);
        } else {
          toast(`Agent ${data.username} went offline`, {
            icon: "⚫",
          });
        }
      });

      userSocket.on("messageReceived", (data) => {
        if (selectedAgent && data.sender === selectedAgent.username) {
          setMessages((prev) => [...prev, data]);
        }
      });

      userSocket.on("messageSent", (data) => {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            sender: username,
            senderType: "user",
            content: data.content,
            timestamp: data.timestamp,
          },
        ]);
      });

      userSocket.on("agentTyping", (data) => {
        if (data.agentUsername === selectedAgent?.username) {
          setAgentTyping(data.isTyping);
        }
      });

      userSocket.on("error", (data) => {
        toast.error(data.message);
        setIsConnecting(false);
      });

      userSocket.on("connect", () => {
        console.log("User socket connected");
        if (username && !isIdentified) {
          userSocket.emit("identifyUser", { username: username.trim() });
        }
      });

      userSocket.on("disconnect", () => {
        console.log("User socket disconnected");
        setIsIdentified(false);
        setIsConnecting(false);
      });

      return () => {
        userSocket.off("userIdentified");
        userSocket.off("agentStatusChanged");
        userSocket.off("messageReceived");
        userSocket.off("messageSent");
        userSocket.off("agentTyping");
        userSocket.off("error");
        userSocket.off("connect");
        userSocket.off("disconnect");
      };
    }
  }, [userSocket, selectedAgent, username, isIdentified]);

  useEffect(() => {
    if (userSocket) {
      const handleReconnect = () => {
        console.log("User socket reconnected");
        if (isIdentified) {
          userSocket.emit("identifyUser", { username: username.trim() });
          if (selectedAgent) {
            loadChatHistory(selectedAgent.username);
          }
        }
      };

      userSocket.on("reconnect", handleReconnect);

      return () => {
        userSocket.off("reconnect", handleReconnect);
      };
    }
  }, [userSocket, isIdentified, username, selectedAgent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleIdentify = (e) => {
    e.preventDefault();
    if (username.trim() && !isConnecting) {
      setIsConnecting(true);
      localStorage.setItem("chatUsername", username.trim());
      connectUser();

      const identifyUser = () => {
        if (userSocket && userSocket.connected) {
          userSocket.emit("identifyUser", { username: username.trim() });
        } else {
          setTimeout(identifyUser, 100);
        }
      };

      setTimeout(identifyUser, 100);
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem("chatUsername");
    if (storedName) {
      setUsername(storedName);
    }
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!isIdentified || !userSocket || !userSocket.connected) {
      toast.error("Please wait, reconnecting...");
      return;
    }

    if (newMessage.trim() && selectedAgent) {
      userSocket.emit("sendMessage", {
        receiverUsername: selectedAgent.username,
        content: newMessage.trim(),
      });
      setNewMessage("");
      stopTyping();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (selectedAgent && userSocket && userSocket.connected && isIdentified) {
      if (!isTyping) {
        setIsTyping(true);
        userSocket.emit("typing", {
          receiverUsername: selectedAgent.username,
          isTyping: true,
        });
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    }
  };

  const stopTyping = () => {
    if (
      isTyping &&
      selectedAgent &&
      userSocket &&
      userSocket.connected &&
      isIdentified
    ) {
      setIsTyping(false);
      userSocket.emit("typing", {
        receiverUsername: selectedAgent.username,
        isTyping: false,
      });
    }
  };

  const loadChatHistory = async (agentUsername) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/messages/history?user=${username}&agent=${agentUsername}`
      );
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const selectAgent = (agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setAgentTyping(false);
    if (isIdentified) {
      loadChatHistory(agent.username);
    }
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!isIdentified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6">
        <div className="absolute top-6 left-6">
          <Link
            to="/"
            className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                <User className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Join Chat</h1>
              <p className="text-gray-400">
                Enter your username to start chatting with agents
              </p>
            </div>

            <form onSubmit={handleIdentify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isConnecting}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="Enter your username"
                />
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "Connecting..." : "Join Chat"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Available Agents</h1>
            <Link
              to="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
          <div className="text-sm text-gray-400">
            Logged in as:{" "}
            <span className="text-white font-medium">{username}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {agents.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No agents available</p>
            </div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => selectAgent(agent)}
                className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
                  selectedAgent?.username === agent.username
                    ? "bg-gray-800"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                        agent.isOnline ? "bg-green-500" : "bg-gray-500"
                      }`}
                    >
                      {agent.isOnline && (
                        <Circle
                          className="w-2 h-2 text-green-500 animate-pulse m-0.5"
                          fill="currentColor"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {agent.username}
                    </div>
                    <div
                      className={`text-sm ${
                        agent.isOnline ? "text-green-400" : "text-gray-400"
                      }`}
                    >
                      {agent.isOnline ? "Live" : "Offline"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedAgent ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                      selectedAgent.isOnline ? "bg-green-500" : "bg-gray-500"
                    }`}
                  >
                    {selectedAgent.isOnline && (
                      <Circle
                        className="w-2 h-2 text-green-500 animate-pulse m-0.5"
                        fill="currentColor"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-white">
                    {selectedAgent.username}
                  </div>
                  <div
                    className={`text-sm ${
                      selectedAgent.isOnline
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {selectedAgent.isOnline ? "Live" : "Offline"}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderType === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderType === "user"
                          ? "bg-white text-black"
                          : "bg-gray-800 text-white"
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          message.senderType === "user"
                            ? "text-gray-600"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {agentTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-800">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder={
                    selectedAgent.isOnline
                      ? "Type a message..."
                      : "Agent is offline"
                  }
                  disabled={!selectedAgent.isOnline}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!selectedAgent.isOnline || !newMessage.trim()}
                  className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Select an Agent</h3>
              <p>Choose an agent from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserChat;
