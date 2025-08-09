/* eslint-disable padding-line-between-statements */
/* eslint-disable import/order */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
const mongoose = require("mongoose");
const express = require('express');
const routerChat = express.Router();
const path = require("path");
const { ChatRoom, ChatMessage } = require('./schema/Chat/chat');

routerChat.post("/create-chatroom", async (req, res) => {

    const { users } = req.body;
    console.log({users});

    try {
        const sortedUsers = users.sort();
        // Check if a chatroom already exists with the same participants
        const existingChatRoom = await ChatRoom.findOne({
            participants: { $all: sortedUsers, $size: sortedUsers.length }
        });
  
        if (existingChatRoom) {
            return res.status(200).json({
            message: 'Chatroom already exists!',
            chatRoomId: existingChatRoom._id,
            participants: existingChatRoom.participants
            });
        }

        const createChatRoom = new ChatRoom({
            participants: sortedUsers
        });
        await createChatRoom.save();
        res.status(200).json({
            message: 'Chatroom created successfully!',
            chatRoomId: createChatRoom._id,
            participants: users
        })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routerChat.post("/send-message", async (req, res) => {

    const { chatRoomId, sender, message } = req.body;

    try {
        const sendChat = new ChatMessage({
            chatRoom: chatRoomId,
            sender,
            message
        })
        await sendChat.save();
        res.status(200).json({ message: 'Message delivered!', chatInfo: sendChat})
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routerChat.post("/get-chatroom-messages", async (req, res) => {
    const { chatRoomId } = req.body;
    if (!chatRoomId) return res.status(400).json({ error: "chatRoomId is required" });

    try {
        const response = await ChatMessage.aggregate([
            { $match: { chatRoom: new mongoose.Types.ObjectId(chatRoomId) } },

            // Format updatedAt to YYYY-MM-DD string
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" }
                    },
                    chatRoom: { $first: "$chatRoom" },
                    messages: {
                        $push: {
                            _id: "$_id",
                            sender: "$sender",
                            message: "$message",
                            updatedAt: "$updatedAt",
                            createdAt: "$createdAt",
                        }
                    }
                }
            },
            // Optional: sort by date descending (newest first)
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({ groupedMessages: response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = { routerChat };

