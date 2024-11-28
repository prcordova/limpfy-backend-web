const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (amount) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Valor em centavos
    currency: "brl",
    payment_method_types: ["card"],
  });
};

exports.refundPayment = async (paymentIntentId, amount) => {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(amount * 100),
  });
};
