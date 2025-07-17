import React, { useState } from 'react';
import axios from 'axios';

const MessageForm = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);

  const handleSend = async () => {
    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('message', message);
    formData.append('image', image);

    await axios.post('http://localhost:5000/api/send', formData);
    alert("Message Sent!");
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow-md rounded-xl">
      <h2 className="text-xl font-bold mb-4">Send WhatsApp Order Message</h2>
      <input type="text" placeholder="Customer Phone" value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full p-2 mb-3 border rounded" />
      <textarea placeholder="Order Message"
        value={message} onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 mb-3 border rounded" />
      <input type="file" onChange={(e) => setImage(e.target.files[0])}
        className="mb-3" />
      <button onClick={handleSend}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        Send via WhatsApp
      </button>
    </div>
  );
};

export default MessageForm;
