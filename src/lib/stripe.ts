import Stripe from "stripe";

let cliente: Stripe | null = null;

export function obtenerStripe(): Stripe {
  if (!cliente) {
    const llave = process.env.STRIPE_SECRET_KEY;
    if (!llave) {
      throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno");
    }
    cliente = new Stripe(llave);
  }
  return cliente;
}