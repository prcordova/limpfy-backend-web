// src/controllers/payments.controller.js
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Job = require("../models/job.model");

exports.createCheckoutSession = async (req, res) => {
  try {
    const {
      amount,
      title,
      description,
      workerQuantity,
      price,
      sizeGarbage,
      typeOfGarbage,
      cleaningType,
      measurementUnit,
      location,
      useDefaultAddress,
    } = req.body;

    // Validação básica dos campos obrigatórios
    if (
      amount === undefined ||
      !title ||
      !description ||
      workerQuantity === undefined ||
      price === undefined ||
      sizeGarbage === undefined ||
      !typeOfGarbage ||
      !cleaningType ||
      !measurementUnit ||
      !location
    ) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    // ID do usuário logado (pego do token)
    const userId = req.user._id.toString();

    // Cria a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "BRL",
            product_data: { name: "Serviço de Limpeza" },
            unit_amount: Math.round(amount * 100), // Valor em centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/orders",
      cancel_url: "http://localhost:3000",

      // Envie tudo que precisar no webhook via metadata
      metadata: {
        clientId: userId,
        title,
        description,
        workerQuantity: workerQuantity.toString(),
        price: price.toString(),
        sizeGarbage: sizeGarbage.toString(),
        typeOfGarbage,
        cleaningType,
        measurementUnit,
        location: JSON.stringify(
          useDefaultAddress ? req.user.address : location
        ),
      },
    });

    // Retorna a URL da sessão de checkout
    console.log("Sessão de Checkout criada com sucesso:", session.id);
    return res.json({ url: session.url });
  } catch (err) {
    console.error("Erro ao criar checkout session:", err);
    return res.status(500).json({ error: "Falha ao criar checkout session" });
  }
};

// 2) Cria PaymentIntent (se ainda quiser usar em outro fluxo)
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ error: "Falta 'amount' no body." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "BRL",
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Erro ao criar PaymentIntent:", err);
    return res.status(500).json({ error: "Falha ao criar pagamento" });
  }
};

// Função para lidar com o webhook do Stripe
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Webhook recebido e validado:", event.type);
  } catch (err) {
    console.error("Erro ao validar webhook:", err);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // Somente aqui verificamos event.type
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const {
      clientId,
      title,
      description,
      workerQuantity,
      price,
      sizeGarbage,
      typeOfGarbage,
      cleaningType,
      measurementUnit,
      location,
    } = session.metadata || {};

    console.log("Dados da sessão para criação do Job:", {
      clientId,
      title,
      description,
      workerQuantity,
      price,
      sizeGarbage,
      typeOfGarbage,
      cleaningType,
      measurementUnit,
      location,
    });

    // Verifique se todos os campos necessários estão presentes
    if (
      !clientId ||
      !title ||
      !description ||
      workerQuantity === undefined ||
      !price ||
      !sizeGarbage ||
      !typeOfGarbage ||
      !cleaningType ||
      !measurementUnit ||
      !location
    ) {
      console.error("Metadados incompletos no webhook:", session.metadata);
      return res.status(400).send("Metadados incompletos.");
    }

    // Parse do objeto de localização
    let locationData = {};
    try {
      locationData = JSON.parse(location);
    } catch (err) {
      console.error("Erro ao parsear location do metadata:", err);
      return res.status(400).send("Erro ao parsear localização.");
    }

    try {
      // Cria o Job manualmente no Mongo
      const newJob = new Job({
        title,
        description,
        workerQuantity: Number(workerQuantity),
        price: Number(price),
        sizeGarbage: Number(sizeGarbage),
        typeOfGarbage,
        cleaningType,
        measurementUnit,
        location: locationData,
        clientId: clientId,
        status: "paid",
      });

      await newJob.save();
      console.log("Job criado via webhook:", newJob._id);
    } catch (dbErr) {
      console.error("Erro ao criar Job no webhook:", dbErr);
      // Dependendo da necessidade, você pode responder com erro ou continuar
    }
  }

  return res.status(200).end();
};

// 4) sendPaymentToWorker (se for usar Stripe Connect depois)
exports.sendPaymentToWorker = async (req, res) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job não encontrado" });
    }

    if (job.status !== "completed") {
      return res.status(400).json({ message: "Job ainda não está concluído" });
    }

    // Se fosse Connect:
    // const worker = await User.findById(job.workerId);
    // const workerStripeAccount = worker.stripeConnectId;
    const amountToSend = Math.round(job.price * 0.65 * 100);

    // Exemplo sem Connect:
    // job.paymentReleased = true;
    // await job.save();

    // Atualizar o Job para indicar que o pagamento foi iniciado
    job.paymentReleased = true;
    await job.save();

    return res.json({ message: "Pagamento ao worker iniciado com sucesso" });
  } catch (err) {
    console.error("Erro ao enviar pagamento:", err);
    return res.status(500).json({ message: "Erro ao enviar pagamento" });
  }
};
