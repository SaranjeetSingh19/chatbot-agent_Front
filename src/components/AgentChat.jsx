import { Bot, Circle, LogOut, MessageCircle, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { io } from "socket.io-client";

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
const SOCKET_SERVER_URL = WEBSOCKET_URL;

const AgentChat = () => {
  const { agent, logout } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userTyping, setUserTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!agent) {
      navigate("/agent/auth");
      return;
    }

    const socket = io(`${SOCKET_SERVER_URL}/agent`, {
      auth: { token: agent.token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("getInitialUsers");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("initialUserList", (data) => {
      setUsers(data.users || []);
    });

    socket.on("newUserMessage", ({ username, lastMessage, timestamp }) => {
      setUsers((prev) => {
        const idx = prev.findIndex((u) => u.username === username);
        const updated = { username, lastMessage, timestamp };
        if (idx >= 0) {
          const arr = [...prev];
          arr.splice(idx, 1);
          arr.unshift(updated);
          return arr;
        }
        return [updated, ...prev];
      });
      toast.success(`New chat from ${username}`);
    });

    socket.on("messageReceived", (msg) => {
      if (msg.sender === selectedUser?.username) {
        setMessages((ms) => [...ms, msg]);
      }
      setUsers((prev) => {
        const i = prev.findIndex((u) => u.username === msg.sender);
        const updated = {
          username: msg.sender,
          lastMessage: msg.content,
          timestamp: msg.timestamp,
        };
        if (i >= 0) {
          const a = [...prev];
          a.splice(i, 1);
          a.unshift(updated);
          return a;
        }
        return [updated, ...prev];
      });
      if (msg.sender !== selectedUser?.username) {
        toast(`${msg.sender}: ${msg.content}`);
      }
    });

    socket.on("messageSent", (msg) => {
      setMessages((ms) => [
        ...ms,
        {
          ...msg,
          senderType: "agent",
          sender: agent.username,
        },
      ]);
    });

    socket.on("userTyping", ({ userUsername, isTyping }) => {
      if (userUsername === selectedUser?.username) {
        setUserTyping(isTyping);
      }
    });

    socket.on("error", ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [agent, navigate, selectedUser]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    setMessages([]);
    setUserTyping(false);

    if (!selectedUser) return;

    socket.emit("leaveRoom");

    socket.emit("joinRoom", { username: selectedUser.username });

    fetch(
      `${SOCKET_SERVER_URL}/api/messages/history` +
        `?user=${encodeURIComponent(selectedUser?.username)}` +
        `&agent=${encodeURIComponent(agent?.username)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load chat history");
        return res.json();
      })
      .then(({ messages: history = [] }) => {
        setMessages(history);
      })
      .catch((err) => {
        console.error("Error loading history:", err);
        toast.error("Could not load chat history");
      });
  }, [selectedUser, agent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, userTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !isConnected) return;

    socketRef.current.emit("sendMessage", {
      receiverUsername: selectedUser.username,
      content: newMessage.trim(),
    });
    setNewMessage("");
    stopTyping();
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!selectedUser || !isConnected) return;

    socketRef.current.emit("typing", {
      receiverUsername: selectedUser.username,
      isTyping: true,
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 1000);
  };

  const stopTyping = () => {
    if (!selectedUser || !isConnected) return;
    socketRef.current.emit("typing", {
      receiverUsername: selectedUser.username,
      isTyping: false,
    });
  };

  const handleLogout = () => {
    socketRef.current.disconnect();
    logout();
    navigate("/agent/auth");
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">
          <div className="animate-spin h-16 w-16 border-4 border-white rounded-full mb-4" />
          Connecting…
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-gray-800">
          <h2 className="font-bold">Agent: {agent.username}</h2>
          <button onClick={handleLogout}>
            <LogOut className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <h3 className="text-sm text-gray-400 mb-2">
            Active Chats ({users.length})
          </h3>
          {users.map((u) => (
            <div
              key={u.username}
              onClick={() => setSelectedUser(u)}
              className={`p-2 mb-2 rounded cursor-pointer hover:bg-gray-800 ${
                selectedUser?.username === u.username ? "bg-gray-800" : ""
              }`}
            >
              <div className="font-medium">{u.username}</div>
              <div className="text-xs text-gray-400 truncate">
                {u.lastMessage}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <MessageCircle className="mx-auto mb-2 opacity-50" />
              No active chats
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-800 flex items-center space-x-3">
              <Bot className="w-6 h-6" />
              <div>
                <div className="font-medium">{selectedUser.username}</div>
                <div className="text-xs text-gray-400">User</div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.senderType === "agent" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-md ${
                      m.senderType === "agent"
                        ? "bg-white text-black"
                        : "bg-gray-800"
                    }`}
                  >
                    <div>{m.content}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {userTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 p-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-gray-800 flex space-x-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Type your reply…"
                className="flex-1 px-3 py-2 bg-gray-800 rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-white text-black rounded-lg disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentChat;
