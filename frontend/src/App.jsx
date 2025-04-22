import React, { useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const userId = "vaishali";

  const sendMessage = async () => {
    if (!message) return;
    setChat([...chat, { sender: "User", text: message }]);

    const res = await axios.post("http://localhost:8000/chat", {
      user_id: userId,
      message: message,
    });

    setChat((prev) => [...prev, { sender: "Bot", text: res.data.reply }]);
    setMessage("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Ardoq Support Bot</h2>
      <div style={{ height: 300, overflowY: "scroll", border: "1px solid gray", padding: 10 }}>
        {chat.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: "80%", marginTop: 10 }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
