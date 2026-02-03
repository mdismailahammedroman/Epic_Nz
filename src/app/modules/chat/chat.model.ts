import { Schema, model, Types } from "mongoose";

const chatSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    admin: { type: Types.ObjectId, ref: "User", required: true },
    lastMessage: { type: Types.ObjectId, ref: "Message" },
  },
  { timestamps: true },
);

export const Chat = model("Chat", chatSchema);

// io.on("connection", (socket) => {
//   console.log("✅ New client connected:", socket.id);

//   // user joins their own room
//   socket.on("joinroom", (userId) => {
//     socket.join(userId);
//     console.log("✅ user joined room:", userId);
//   });

//   // admin joins admin room
//   socket.on("admin:join", () => {
//     socket.join("admin_room");
//     console.log("✅ admin joined admin_room");
//   });

//   socket.on("disconnect", () => {
//     console.log("❌ Client disconnected:", socket.id);
//   });
// });

// // router.post("/send_message", async (req, res) => {
// //   const { text, senderId } = req.body;

// //   // send to admin inbox room
// //   io.to("admin_room").emit("admin_message", {
// //     senderId,
// //     text,
// //     createdAt: Date.now(),
// //   });

// //   sendResponse(res, {
// //     success: true,
// //     statusCode: 201,
// //     message: "Message sent success!",
// //     data: null,
// //   });
// // });

// // router.post("/admin_reply", async (req, res) => {
// //   const { userId, text } = req.body;

// //   // send to user room (userId)
// //   io.to(userId).emit("message", {
// //     text,
// //     sender: "admin",
// //     createdAt: Date.now(),
// //   });

// //   // optional: also notify admin UI that it was sent
// //   io.to("admin_room").emit("admin_sent", { userId, text, createdAt: Date.now() });

// //   sendResponse(res, {
// //     success: true,
// //     statusCode: 201,
// //     message: "Reply sent!",
// //     data: null,
// //   });
// // });
