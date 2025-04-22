import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
   channel: {
      type: mongoose.Schema.Types.ObjectId, // channel being subscribed to
      ref: 'User',
      required: true
   },
   subscriber: {
      type: mongoose.Schema.Types.ObjectId, // user who is subscribing
      ref: 'User',
      required: true
   },
}, {timestamps: true});

export const Subscription = mongoose.model('Subscription', subscriptionSchema);