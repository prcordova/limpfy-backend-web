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

//ADMIN envia mensagem de disputa
exports.sendDisputeMessage = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ message: "Trabalho não encontrado" });

    if (job.status !== "dispute") {
      return res
        .status(400)
        .json({ message: "Este trabalho não está em disputa." });
    }

    // Verifica o role do usuário a partir de req.user.role
    // Apenas admin, cliente (job.clientId) ou trabalhador (job.workerId) podem enviar
    // Mas você pode restringir ainda mais se necessário (por ex, se trabalhador não pode enviar após disputa aberta).
    let senderRole = req.user.role; // 'admin', 'client', 'worker'

    // Cliente só envia se job.clientId === req.user._id
    if (
      senderRole === "client" &&
      job.clientId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    // Trabalhador só envia mensagem se assim for permitido pela lógica (por ex, pode ser bloqueado na disputa)
    if (
      senderRole === "worker" &&
      job.workerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    // Admin pode sempre enviar, assumindo que req.user.role === 'admin'

    job.disputeMessages.push({
      senderId: req.user._id,
      senderRole: senderRole,
      message: req.body.message,
    });

    await job.save();

    // Enviar via socket.io para as partes envolvidas (cliente, trabalhador, admin) se desejado
    // ...

    res.json({ message: "Mensagem enviada", job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//resolve disputa
exports.resolveDispute = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ message: "Trabalho não encontrado" });

    // Verificar role admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Apenas admin pode resolver disputas" });
    }

    if (job.status !== "dispute" || job.disputeStatus !== "open") {
      return res.status(400).json({ message: "A disputa não está aberta." });
    }

    // Decisão do admin: liberar pagamento ou não
    // Suponha que req.body.action seja "release-payment" ou "refund-client"
    const action = req.body.action;
    if (!action) {
      return res.status(400).json({ message: "Ação não fornecida." });
    }

    job.disputeStatus = "resolved";
    job.status = "completed";
    job.disputeResolvedAt = new Date();

    if (action === "release-payment") {
      job.paymentReleased = true;
      // Lógica de pagamento ao trabalhador...
    } else if (action === "refund-client") {
      job.paymentReleased = false;
      // Lógica de reembolso ao cliente...
    } else {
      return res.status(400).json({ message: "Ação inválida." });
    }

    await job.save();

    // Notificar cliente e trabalhador do resultado via notificação e/ou socket
    // ...

    res.json({ message: "Disputa resolvida com sucesso.", job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
