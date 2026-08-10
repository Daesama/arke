import { CrearClient } from "./CrearClient";

/*
  El editor es un client component grande; esta página lo monta y nada
  más. Se mantiene la separación página/cliente por si vuelve a hacer
  falta resolver algo en el servidor antes de renderizarlo.
*/
export default function CrearPage() {
  return <CrearClient />;
}
