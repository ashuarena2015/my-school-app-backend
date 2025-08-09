const mongoose = require("mongoose");

const ChatRoomSchema = new mongoose.Schema(
  {
    participants: { type: Array, required: true },
    lastMessage: { type: String },
    updatedAt: { type: Date, default: Date.now },
  }, { timestamps: true }
);

const ChatMessageSchema = new mongoose.Schema({
  chatRoom: { type: mongoose.Schema.Types.ObjectId, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// const ChatGetMessageSchema = new mongoose.Schema({

// })

const ChatRoom = mongoose.model("chatroom", ChatRoomSchema);
const ChatMessage = mongoose.model("chatmessage", ChatMessageSchema);


module.exports ={ ChatRoom, ChatMessage };
