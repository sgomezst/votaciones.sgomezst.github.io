
import React, { useState, useEffect, useCallback } from 'react';
import { User, Submission, Vote, ContestState, ContestPhase, RatingCriterion } from './types';
import * as sheetService from './services/googleSheetsService';
import AuthForm from './components/AuthForm';
import AdminPanel from './components/AdminPanel';
import SubmissionForm from './components/SubmissionForm';
import SubmissionCard from './components/SubmissionCard';
import WinnerDisplay from './components/WinnerDisplay';
import Spinner from './components/Spinner';

const APP_STORAGE_KEY = 'anonymousChallengeUser';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [contestState, setContestState] = useState<ContestState | null>(null);
  const [winner, setWinner] = useState<{ submission: Submission; score: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setAppError(null);
  
    const DEFAULT_CONTEST_STATE: ContestState = {
      phase: ContestPhase.SUBMISSION,
      ratingCriteria: [],
      challengeTitle: "Configura el Título del Reto",
    };
  
    try {
      const [fetchedSubmissions, fetchedVotes, fetchedStateRaw] = await Promise.all([
        sheetService.getSubmissions(),
        sheetService.getVotes(),
        // Añadimos un .catch aquí para que Promise.all no falle si solo getContestState falla
        sheetService.getContestState().catch(err => {
            console.warn("No se pudo cargar el estado del reto, se usarán valores por defecto. Esto es normal en la primera ejecución.", err);
            // Si falla, devolvemos null para que la app pueda continuar con el estado por defecto.
            return null;
        }),
      ]);
      
      const rawState: Partial<ContestState> = fetchedStateRaw || {};
      const currentState = {
        phase: rawState.phase || DEFAULT_CONTEST_STATE.phase,
        ratingCriteria: Array.isArray(rawState.ratingCriteria) ? rawState.ratingCriteria : DEFAULT_CONTEST_STATE.ratingCriteria,
        challengeTitle: rawState.challengeTitle || DEFAULT_CONTEST_STATE.challengeTitle,
      };

      setContestState(currentState);
      setSubmissions(fetchedSubmissions || []);
      setVotes(fetchedVotes || []);

      if (currentState.phase === ContestPhase.REVEALED) {
        const fetchedWinner = await sheetService.getWinner().catch(() => null);
        setWinner(fetchedWinner);
      } else {
        setWinner(null);
      }
  
    } catch (error) {
      // Este bloque se ejecutará si getSubmissions o getVotes fallan
      console.error("Fallo al cargar los datos de participaciones/votos", error);
      setAppError("No se pudo cargar la información de participaciones y votos. El panel de admin sigue disponible.");
      // Aún si hay un error, inicializamos el estado del concurso para que el admin pueda verlo.
      setContestState(DEFAULT_CONTEST_STATE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto para inicializar la app: comprueba el usuario guardado y luego carga los datos
  useEffect(() => {
    const initializeApp = async () => {
        try {
            const savedUserJSON = localStorage.getItem(APP_STORAGE_KEY);
            if (savedUserJSON) {
                const savedUser = JSON.parse(savedUserJSON);
                setCurrentUser(savedUser);
            }
        } catch (error) {
            console.error("Could not load user from local storage", error);
            localStorage.removeItem(APP_STORAGE_KEY); // Limpiar datos corruptos
        }
        await fetchData();
    };
    initializeApp();
  }, [fetchData]);

  const handleLogin = async (name: string, password: string) => {
    try {
        const user = await sheetService.loginUser(name, password);
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(user));
        setCurrentUser(user);
        await fetchData();
    } catch(error) {
        console.error("Failed to login", error);
        localStorage.removeItem(APP_STORAGE_KEY);
        throw error;
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem(APP_STORAGE_KEY);
    setCurrentUser(null);
  }

  const handleRegister = async (name: string, password: string) => {
    try {
        const newUser = await sheetService.addUser(name, password);
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(newUser));
        setCurrentUser(newUser);
        await fetchData();
    } catch(error) {
        console.error("Failed to register user", error);
        localStorage.removeItem(APP_STORAGE_KEY);
        throw error;
    }
  };

  const handleAddSubmission = async (payload: { participantName: string; userId: string; textContent: string; imageBase64: string | null; }) => {
    try {
        const newSubmission = await sheetService.addSubmission(payload);
        setSubmissions(prev => [...prev, newSubmission]);
        alert("¡Tu participación ha sido enviada con éxito!");
    } catch (error) {
        console.error("Failed to add submission", error);
        setAppError("No se pudo enviar tu participación.");
    }
  };

  // Función centralizada para actualizar el estado del concurso y sincronizarlo con el backend
  const updateAndSyncContestState = async (updates: Partial<ContestState>) => {
    if (!contestState) {
        throw new Error("El estado del concurso no está inicializado.");
    }
    // Envía el objeto de estado COMPLETO para mayor robustez en el backend
    const stateToSend = { ...contestState, ...updates };
    try {
        const returnedStateRaw = await sheetService.updateContestState(stateToSend);
        
        // El backend puede devolver un objeto incompleto.
        // Lo normalizamos aquí para garantizar que el estado de la app sea siempre consistente
        // y prevenir errores como "cannot read property 'map' of undefined".
        const returnedState: Partial<ContestState> = returnedStateRaw || {};
        const finalState: ContestState = {
            phase: returnedState.phase || contestState.phase,
            ratingCriteria: Array.isArray(returnedState.ratingCriteria) ? returnedState.ratingCriteria : [], // ¡Importante! Asegura que siempre sea un array.
            challengeTitle: returnedState.challengeTitle || contestState.challengeTitle,
        };

        setContestState(finalState);
        return finalState;

    } catch (error) {
        console.error("Failed to update contest state:", error);
        setAppError("No se pudo guardar el cambio en el estado del concurso.");
        throw error; // Re-lanzar para que los llamadores puedan manejarlo si es necesario
    }
};


  const handlePhaseChange = async (phase: ContestPhase) => {
    try {
        await updateAndSyncContestState({ phase });
        // Lógica específica que se ejecuta DESPUÉS de un cambio de fase exitoso
        if (phase === ContestPhase.REVEALED) {
            const fetchedWinner = await sheetService.getWinner();
            setWinner(fetchedWinner);
        } else {
            setWinner(null);
            if (phase === ContestPhase.SUBMISSION) { // Reiniciar al comenzar un nuevo reto
                setSubmissions([]);
                setVotes([]);
            }
        }
    } catch (error) {
        // El error ya fue manejado y logueado por updateAndSyncContestState
    }
  };

  const handleCriteriaChange = async (newCriteria: RatingCriterion[]) => {
    await updateAndSyncContestState({ ratingCriteria: newCriteria }).catch(() => {});
  };

  const handleTitleChange = async (newTitle: string) => {
    await updateAndSyncContestState({ challengeTitle: newTitle }).catch(() => {});
  };

  const handleVote = async (submissionId: string, ratings: { [criterionId: string]: number }) => {
    if (!currentUser) return;
    try {
        const newVote: Vote = { userId: currentUser.id, submissionId, ratings };
        await sheetService.castVote(newVote);
        setVotes(prev => [...prev.filter(v => !(v.userId === currentUser.id && v.submissionId === submissionId)), newVote]);
    } catch (error) {
        console.error("Failed to cast vote", error);
        setAppError("No se pudo registrar tu voto.");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-xl font-bold">
          <Spinner />
          <span className="mt-4">Cargando Reto...</span>
        </div>
      );
    }
  
    if (!currentUser) {
      // Muestra error solo si no estamos logueados y hubo un error de carga inicial
      if (appError && !contestState) {
         return <div className="min-h-screen flex items-center justify-center text-xl text-red-500 p-8">{appError}</div>;
      }
      return <AuthForm onLogin={handleLogin} onRegister={handleRegister} />;
    }
  
    // Si estamos logueados pero contestState es null, algo falló de forma crítica en la carga inicial
    if (!contestState) {
         return <div className="min-h-screen flex items-center justify-center text-xl text-red-500 p-8">{appError || "Error fatal: No se pudo inicializar el estado del concurso."}</div>;
    }

    const userHasSubmitted = submissions.some(s => s.userId === currentUser.id);
  
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Reto Anónimo</h1>
          <div className="flex items-center gap-4">
              <span className="font-semibold">{currentUser.name} {currentUser.isAdmin && ' (Admin)'}</span>
              <button onClick={handleLogout} className="text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg">Salir</button>
          </div>
        </header>
        
        <main className="container mx-auto p-4 md:p-8">
          {appError && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{appError}</div>}
          
          {currentUser.isAdmin && (
            <AdminPanel 
              currentPhase={contestState.phase} 
              criteria={contestState.ratingCriteria}
              challengeTitle={contestState.challengeTitle}
              onPhaseChange={handlePhaseChange}
              onCriteriaChange={handleCriteriaChange}
              onTitleChange={handleTitleChange}
              />
          )}
          
          {contestState.phase === ContestPhase.SUBMISSION && (
            userHasSubmitted ? (
              <div className="text-center p-8 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-xl max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold mb-2">¡Gracias por participar!</h2>
                  <p>Tu participación ha sido enviada. Ahora puedes esperar a que comience la fase de votación.</p>
              </div>
            ) : (
               <SubmissionForm 
                  currentUser={currentUser} 
                  onAddSubmission={handleAddSubmission}
                  challengeTitle={contestState.challengeTitle}
                  />
            )
          )}
          
          {contestState.phase === ContestPhase.VOTING && (
              <div>
                  <h2 className="text-3xl font-bold text-center mb-2">{contestState.challengeTitle}</h2>
                  <p className="text-xl text-center text-gray-500 dark:text-gray-400 mb-8">Fase de Votación: ¡Elige a tu favorito!</p>
                  {submissions.length === 0 ? (
                      <p className="text-center text-lg mt-10">Aún no hay participaciones. ¡Vuelve más tarde!</p>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {submissions.map((sub, index) => (
                          <SubmissionCard 
                          key={sub.id}
                          submission={sub}
                          index={index}
                          criteria={contestState.ratingCriteria}
                          currentUser={currentUser}
                          existingVote={votes.find(v => v.userId === currentUser.id && v.submissionId === sub.id)}
                          onVote={handleVote}
                          />
                      ))}
                      </div>
                  )}
              </div>
          )}
          
          {contestState.phase === ContestPhase.REVEALED && (
              winner ? (
                  <WinnerDisplay winner={winner} challengeTitle={contestState.challengeTitle} />
              ) : (
                  <div className="text-center p-8 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-xl max-w-2xl mx-auto">
                      <h2 className="text-2xl font-bold mb-2">Resultados Finales</h2>
                      <p>No se pudo determinar un ganador. ¡Puede que no hubiera suficientes votos o participaciones!</p>
                  </div>
              )
          )}
        </main>
      </div>
    );
  }

  return renderContent();
};

export default App;
