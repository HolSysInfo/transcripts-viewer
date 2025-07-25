  import mongoose, { Schema } from "mongoose"

  const ChannelSchema = new Schema({
    id: { type: String, required: true },
    name: String,
    topic: String,
  }, { _id: false })

  export default mongoose.models.Channels ||
    mongoose.model("Channels", ChannelSchema)