// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const stripe = require("stripe")("sk_test_51M6yuaGVGY5ZHyS9Cg0qqGM8t8KeKVWgcXTNzrGIEEFZGuheJRIEJ2kaku2Alju4N3aJOAXjO7QcPuxuJucbnYwv00inFlWnTt");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Corrected function to map ticket types to prices in cents
function getTicketPrice(type) {
    // Frontend prices are in MAD. We convert them to cents USD
    // Using an approx. conversion rate of 1 USD = 10 MAD for demonstration
    switch (type) {
        case "entree":
            return 20 * 10;
        case "pass-simple":
            return 250 * 10;
        case "pass-premium":
            return 400 * 10;
        case "pass-vip":
            return 800 * 10;
        default:
            return 0;
    }
}

// Function to send confirmation email
async function sendConfirmationEmail(name, email, type, quantity) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "salahhajji32@gmail.com",
            pass: "pelzkolfppxwfzen", // Corrected password without spaces
        },
    });

    const mailOptions = {
        from: "salahhajji32@gmail.com",
        to: email,
        subject: "Ticket Confirmation",
        text: `Hello ${name},\n\nYou purchased ${quantity} ${type} ticket(s). Thank you!`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.post("/buy-ticket", async (req, res) => {
    const { name, email, type, quantity } = req.body;

    if (!name || !email || !type || !quantity) {
        console.error("Missing required fields in request body.");
        return res.status(400).json({ error: "Missing required fields." });
    }

    const price = getTicketPrice(type);
    if (price === 0) {
        console.error("Invalid ticket type received:", type);
        return res.status(400).json({ error: "Invalid ticket type." });
    }

    const amount = price * quantity;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            receipt_email: email,
            metadata: { name, type, quantity },
        });

        sendConfirmationEmail(name, email, type, quantity);

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Stripe or server error:", error.message);
        res.status(500).json({ error: error.message || "Something went wrong!" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});