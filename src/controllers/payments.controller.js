// src/controllers/payments.controller.js
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Job = require("../models/job.model");

const successUrl = process.env.STRIPE_SUCCESS_URL;
const cancelUrl = process.env.STRIPE_CANCEL_URL;

// Criação da sessão de checkout
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

    const userId = req.user._id.toString();

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "BRL",
            product_data: { name: "Serviço de Limpeza" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
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

    console.log("Sessão de Checkout criada com sucesso:", session.id);
    return res.json({ url: session.url });
  } catch (err) {
    console.error("Erro ao criar checkout session:", err);
    return res.status(500).json({ error: "Falha ao criar checkout session" });
  }
};

// Criação de Payment Intent
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

// Webhook do Stripe
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Webhook recebido e validado com sucesso:", event.type);
  } catch (err) {
    console.error("Erro ao validar webhook:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // Log do evento recebido
  console.log("Evento recebido do Stripe:", event);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log(
      "Dados recebidos no evento checkout.session.completed:",
      session
    );

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

    console.log("Metadados extraídos:", {
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

    let locationData;
    try {
      locationData = JSON.parse(location);
      console.log("Localização parseada com sucesso:", locationData);
    } catch (err) {
      console.error("Erro ao parsear localização:", err.message);
      return res.status(400).send("Erro ao parsear localização.");
    }

    try {
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
      console.log("Job criado com sucesso no MongoDB:", newJob);
    } catch (err) {
      console.error("Erro ao salvar Job no MongoDB:", err.message);
    }
  }

  return res.status(200).end();
};

// Envio de pagamento para o trabalhador
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

    const amountToSend = Math.round(job.price * 0.65 * 100);

    job.paymentReleased = true;
    await job.save();

    return res.json({ message: "Pagamento ao worker iniciado com sucesso" });
  } catch (err) {
    console.error("Erro ao enviar pagamento:", err);
    return res.status(500).json({ message: "Erro ao enviar pagamento" });
  }
};
