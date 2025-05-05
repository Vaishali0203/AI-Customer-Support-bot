import React, { useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Show user's message
    setChat((prev) => [...prev, { sender: "User", text: message }]);

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        question: message,
      });

      setChat((prev) => [...prev, { sender: "Bot", text: res.data.answer }]);
    } catch (err) {
      setChat((prev) => [
        ...prev,
        { sender: "Bot", text: "Sorry, something went wrong." },
      ]);
    }

    setMessage("");
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Ardoq Support Assistant</h2>
      <div
        style={{
          height: 300,
          overflowY: "scroll",
          border: "1px solid gray",
          padding: 10,
          marginBottom: 10,
        }}
      >
        {chat.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="Ask a question..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        style={{ width: "80%", marginRight: 10 }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
