
import { User, Submission, Vote, ContestState } from '../types';

// URL de la aplicación web de Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyWJjkNZ-666RrQIg_8IoEChSS1fjGw0_tn08r8fZLViFnJ6k7aVS-_oN5dg6rYhWyg/exec".trim();

// --- HELPERS ---

/**
 * Maneja la respuesta de la API de Google Apps Script de forma robusta.
 * Verifica si la respuesta es OK, si es JSON, y si la operación fue exitosa.
 * @param response La respuesta de la función fetch.
 * @returns Los datos de la respuesta si fue exitosa.
 * @throws Un error detallado si algo sale mal.
 */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'No se pudo leer el cuerpo del error.');
    throw new Error(`Error de red: ${response.status} - ${response.statusText}. Cuerpo: ${errorBody}`);
  }

  const responseText = await response.text();
  
  if (!responseText) {
      throw new Error('El servidor devolvió una respuesta vacía.');
  }

  // Un problema común con Apps Script es recibir una página HTML (como la de inicio de sesión) en lugar de JSON.
  if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html')) {
      console.error("Se recibió HTML en lugar de JSON:", responseText);
      throw new Error('El servidor devolvió una respuesta inesperada (HTML). Verifica los permisos de despliegue del Google Apps Script. Debe estar configurado para ser ejecutado por "Cualquiera, incluso anónimo".');
  }

  try {
    const result = JSON.parse(responseText.trim());
    // Comprueba explícitamente `false`, ya que `result.success` podría ser undefined si la respuesta no sigue el formato esperado.
    if (result.success === false) { 
      // Si el servidor devolvió un error con `success: false`, lanzamos ese error directamente
      throw new Error(result.error || 'Ocurrió un error en el servidor de Google Sheets.');
    }
    return result.data;
  } catch (e: any) {
    // Solo si el JSON.parse falla (SyntaxError), o si el error lanzado por `result.success === false`
    // no es un `Error` sino alguna otra cosa (poco probable), entonces lo manejamos aquí.
    if (e instanceof SyntaxError) {
      console.error("Fallo al parsear la respuesta JSON:", responseText, e);
      throw new Error('La respuesta del servidor no era un JSON válido.');
    } else {
      // Si es otro tipo de error (como el que lanzamos desde `result.success === false`),
      // lo volvemos a lanzar para que el componente lo maneje.
      throw e;
    }
  }
};


/**
 * Realiza una petición GET a la API de Google Apps Script.
 * @param action La acción a ejecutar en el script.
 * @returns Los datos obtenidos.
 */
const getData = async <T>(action: string): Promise<T> => {
  // Añadido redirect: 'follow' para mayor robustez
  const response = await fetch(`${WEB_APP_URL}?action=${action}`, { redirect: 'follow' });
  return handleResponse(response);
};

/**
 * Realiza una petición POST a la API de Google Apps Script.
 * @param action La acción a ejecutar en el script.
 * @param payload Los datos a enviar en el cuerpo de la petición.
 * @returns Los datos devueltos por la API.
 */
const postData = async <T>(action: string, payload: object): Promise<T> => {
  const response = await fetch(WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
      // Usamos 'text/plain' para evitar problemas de CORS con Apps Script.
      // El script del lado del servidor parseará el texto como JSON.
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ action, payload }),
    redirect: 'follow', // Necesario para algunas configuraciones de Apps Script.
  });
  return handleResponse(response);
};


// --- API FUNCTIONS ---

export const getContestState = async (): Promise<ContestState> => {
  return getData<ContestState>('getContestState');
};

export const updateContestState = async (newState: Partial<ContestState>): Promise<ContestState> => {
  return postData<ContestState>('updateContestState', newState);
};

export const getUsers = async (): Promise<User[]> => {
  return getData<User[]>('getUsers');
};

export const addUser = async (name: string, password: string): Promise<User> => {
  return postData<User>('addUser', { name, password });
};

export const loginUser = async (name: string, password: string): Promise<User | null> => {
    return postData<User | null>('loginUser', { name, password });
};

export const getSubmissions = async (): Promise<Submission[]> => {
  return getData<Submission[]>('getSubmissions');
};

export const addSubmission = async (submissionData: {
  participantName: string;
  userId: string;
  textContent: string;
  imageBase64: string | null;
}): Promise<Submission> => {
  return postData<Submission>('addSubmission', submissionData);
};

export const getVotes = async (): Promise<Vote[]> => {
  return getData<Vote[]>('getVotes');
};

export const castVote = async (vote: Vote): Promise<Vote> => {
  return postData<Vote>('castVote', vote);
};

export const getWinner = async (): Promise<{ submission: Submission; score: number } | null> => {
  return getData<{ submission: Submission; score: number } | null>('getWinner');
};
