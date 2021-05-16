const express = require("express");
const router = express.Router();

const PaypalController = require("../controllers/PaypalController");
//importamos el Controller
const PaypalInstance = new PaypalController();
//instanciamos la clase que esta en el controller

router.get("/", (req, res) => {
  //creamos la ruta, que en definitiva es /paypal/
  //ejecutamos la funcion getPaymentLink de nuestro controller
  return PaypalInstance.getPaymentLink(req, res);
});

router.post("/webhook", (req, res) => {
  //tiene que ser una ruta tipo POST para recibir los webhooks
  //creamos la ruta, que en definitiva es /paypal/webhook
  //ejecutamos la funcion webhook que esta en nuestro controller

  PaypalInstance.webhook(req, res);
});

module.exports = router;
