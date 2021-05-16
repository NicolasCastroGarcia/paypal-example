const axios = require("axios");
//importamos axios para hacer las llamadas a la api de Paypal
const querystring = require("querystring");
//lo vamos a necesitar para pedir el token, no es necesario instalarlo

class PaypalController {
  constructor() {
    this.Paypal = {
      url: "https://api.sandbox.paypal.com",
      clientId: "",
      clientSecret: ""
    };
  }

  async getPaymentLink(req, res) {
    try {
      const payment = await this.generateLink({ price: 100 });
      //ejecutamos la función de generarl el link, pasandole por param, el precio, esto es para simular un POST a nuestra api
      return res.json({
        linkPaypal: payment.link
      });
      //retornamos el link
    } catch (e) {
      console.log(e);
      //si pasa algo mal, devolvemos un status 500, y un mensaje de error
      return res.sendStatus(500).json({
        error: true,
        message: "Hubo un error al general el link de pago"
      });
    }
  }

  async generateLink({ price }) {
    const url = `${this.Paypal.url}/v2/checkout/orders`;
    //determinamos la url
    const data = await this.generateToken();
    //generamos el token
    const access_token = await data.access_token;
    //leemos el access_token

    const settings = {
      method: "POST",
      //hacemos un POST
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`
      },
      //en el header mandamos el TOKEN
      data: {
        //enviamos la información requerida por PAYPAL
        intent: "CAPTURE",
        purchase_units: [
          //este es un array de artículos, con su respectivo precio
          {
            amount: {
              currency_code: "USD",
              //la moneda a utilizar
              value: price.toString()
              //el precio, que deber ser un string
            }
          }
        ],
        application_context: {
          //información adicional sobre cómo queremos que sea el checkout
          brand_name: "Marca",
          //el nombre de la marca que va a aparecer cuando el usuario intente comprar
          locale: "es-ES",
          //el idioma que va a intentar a utilizar en el checkout
          user_action: "PAY_NOW",
          //la acción que va a realizar el usuario, generalmente siempre queremos PAY_NOW
          landing_page: "NO_PREFERENCE",
          //esto es por si lo queremos enviar a un flujo puntual de paypal, por ejemplo al login, a pagar, o a otro lado.
          payment_method: {
            //esta es la información que limita los métodos de pago
            payer_selected: "PAYPAL",
            payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
          },
          shipping_preference: "NO_SHIPPING",
          //aclaramos que no vamos a relizar un envio, ya que es un servicio en este ejemplo
          return_url: ""
          //tenemos la opción de ingresar la url a la cual será redirigido el usuario una vez que la transacción sea completada
        }
      },
      url
      //el endpoint de la api de Payapal
    };

    return axios(settings).then(async (response) => {
      // suelen venir muchos links en la respuesta, es por eso que tenemos que hacer un find para encontrar el que necesitamos
      if (response && response.data && response.data.links) {
        const link = response.data.links.find((link) => {
          return link.rel == "approve";
          //el que necesitamos viene con un rel: "approve"
        });
        //retornamos el link que tiene rel: "approve"
        return { link: link.href };
      }
      return;
    });
  }

  generateToken() {
    const url = `${this.Paypal.url}/v1/oauth2/token`;
    //la url para generar el token

    const settings = {
      method: "POST",
      //metodo POST
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: querystring.stringify({ grant_type: "client_credentials" }),
      auth: {
        username: this.Paypal.clientId,
        password: this.Paypal.clientSecret
        //enviamos credenciales
      },
      url
    };

    return axios(settings).then((response) => {
      return response.data;
    });
  }

  async webhook(req, res) {
    if (req.body.event_type == "CHECKOUT.ORDER.APPROVED") {
      //verificamos que el tipo de webhook sea CHECKOUT.ORDER.APPROVED
      const data = await this.paypalService.getToken();
      const access_token = await data.access_token;
      //generamos nuevo token

      //tenemos que capturar la orden para cobrarla
      await axios({
        method: "POST",
        //hacemos un post
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`
          //enviamos el token
        },
        url: `${this.Paypal.url}/v2/checkout/orders/${req.body.resource.id}/capture`
        //esta url contiene la orden que estamos tratando de capturar
      });
    }
    return res.status(200);
  }
}

module.exports = PaypalController;
