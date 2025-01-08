const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getStripeBalance = async (req, res) => {
  try {
    // Verificar se o usuário logado é admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado" });
    }

    // Busca o saldo total do Stripe
    const balance = await stripe.balance.retrieve();

    res.status(200).json({
      balance: {
        available: balance.available.map((b) => ({
          amount: b.amount / 100, // Converte de centavos para unidade monetária
          currency: b.currency.toUpperCase(),
        })),
        pending: balance.pending.map((b) => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase(),
        })),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar saldo do Stripe:", error);
    res.status(500).json({ message: "Erro ao buscar saldo do Stripe." });
  }
};
