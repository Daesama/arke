"use client";

/**
 * Red de seguridad para el resultado de una server action.
 *
 * Next NO rechaza la promesa de una server action cuando la respuesta del
 * POST no es un payload RSC: la resuelve con `undefined`
 * (`server-action-reducer.js` hace `resolve(actionResult)` con
 * `actionResult` sin asignar si el `content-type` no es `text/x-component`).
 * Pasa cuando algo se mete en el medio:
 *
 *  - el proxy corta el request por tamaño (413) o por tiempo (502/504);
 *  - el middleware redirige a /auth/login porque la sesión venció, y el
 *    fetch termina siguiendo un HTML;
 *  - la pestaña quedó abierta contra un build anterior al desplegado y el
 *    id de la acción ya no existe (404 del servidor).
 *
 * El código que hacía `result.error` de una vez se caía con "Cannot read
 * properties of undefined (reading 'error')" — un mensaje que no le dice
 * nada al usuario, esconde la causa real y encima puede aparecer cuando el
 * trabajo del servidor SÍ se completó (el diseño quedó guardado y el
 * cliente igual mostró un error).
 */

export const SIN_RESPUESTA_DEL_SERVIDOR =
  "El servidor no devolvió respuesta. Puede ser la conexión o una imagen muy pesada. Vuelve a intentar.";

/**
 * Devuelve el resultado de la acción, o un `{ error }` legible si nunca
 * llegó. Deja además el rastro en consola con el contexto, que es lo único
 * que permite distinguir después un 413 de un 504 o de una sesión vencida.
 */
export function conRespuesta<T extends { error?: string }>(
  resultado: T | undefined | null,
  contexto: string,
): T {
  if (resultado) return resultado;

  console.error(
    `[${contexto}] La server action no devolvió respuesta (posible 413/502/504 del proxy, ` +
      `redirect del middleware por sesión vencida, o build desactualizado en la pestaña). ` +
      `Revisa la pestaña Network: el POST a esta misma URL no respondió con content-type text/x-component.`,
  );

  return { error: SIN_RESPUESTA_DEL_SERVIDOR } as T;
}
