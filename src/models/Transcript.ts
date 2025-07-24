  import mongoose, { Schema } from "mongoose"

  const UserSchema = new Schema({
    id: { type: String, required: true },
    username: String,
    avatar: String,
    bot: Boolean,
  }, { _id: false })

  const ChannelSchema = new Schema({
    id: { type: String, required: true },
    name: String,
    topic: String,
  }, { _id: false })

  const MessageSchema = new Schema({
    id: { type: String, required: true },
    replyTo: String,
    content: String,
    author: String, // user id
    timestamp: Date,
    embeds: Array,
    buttons: Array,
    edited: Boolean,
    reactions: Array,
  }, { _id: false })

  const TranscriptSchema = new Schema({
    _id: { type: String, required: true },
    transcript_id: { type: String, required: true, unique: true },
    channel: ChannelSchema,
    users: [UserSchema],
    messages: [MessageSchema],
  })

  export default mongoose.models.Transcript ||
    mongoose.model("Transcripts", TranscriptSchema)