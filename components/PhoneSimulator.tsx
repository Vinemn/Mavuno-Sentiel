
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SCENARIOS } from '../constants';
import { diagnosePlantDisease } from '../services/geminiService';
import type { Diagnosis, Scenario } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../context/LocalizationContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

type SimulatorScreen = 'home' | 'scenario_select' | 'camera' | 'diagnosing' | 'diagnosis_result' | 'error' | 'image_preview';

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
  </div>
);


export const PhoneSimulator: React.FC = () => {
    const [screen, setScreen] = useState<SimulatorScreen>('home');
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useLocalization();

    const handleScenarioSelect = (scenario: Scenario) => {
        setSelectedScenario(scenario);
        setDiagnosis(scenario.diagnosis); // Use mock diagnosis for scenarios
        setScreen('diagnosis_result');
    };

    const handleDiagnose = useCallback(async (imageFile: File, userQuery?: string) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = (e.target?.result as string)?.split(',')[1];
            if (base64Data) {
                setScreen('diagnosing');
                setError(null);
                try {
                    const mimeType = imageFile.type || 'image/jpeg';
                    const result = await diagnosePlantDisease({ data: base64Data, mimeType }, userQuery);
                    setDiagnosis(result);
                    setSelectedScenario({
                        id: 'custom',
                        name: 'Uploaded Image',
                        crop: 'Unknown',
                        image: URL.createObjectURL(imageFile),
                        diagnosis: result,
                    });
                    setScreen('diagnosis_result');
                } catch (err) {
                    console.error(err);
                    setError(t('error_gemini_api'));
                    setScreen('error');
                }
            }
        };
        reader.readAsDataURL(imageFile);
    }, [t]);

    const handleImageSelected = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError(t('sim_error_invalid_image'));
            setScreen('error');
            return;
        }
        setCapturedImage(file);
        setScreen('image_preview');
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const reset = () => {
        setScreen('home');
        setSelectedScenario(null);
        setDiagnosis(null);
        setError(null);
        setCapturedImage(null);
    };

    const renderScreen = () => {
        switch (screen) {
            case 'home':
                return <HomeScreen onScan={() => setScreen('camera')} onSelectSample={() => setScreen('scenario_select')} onUpload={triggerFileUpload} />;
            case 'scenario_select':
                return <ScenarioSelectScreen onSelect={handleScenarioSelect} onBack={() => setScreen('home')} />;
            case 'camera':
                return <CameraScreen onUpload={triggerFileUpload} onBack={() => setScreen('home')} onImageCaptured={handleImageSelected} />;
            case 'image_preview':
                return <ImagePreviewScreen imageFile={capturedImage!} onDiagnose={handleDiagnose} onBack={() => setScreen('camera')} />;
            case 'diagnosing':
                return <DiagnosingScreen />;
            case 'diagnosis_result':
                return <DiagnosisResultScreen diagnosis={diagnosis!} scenario={selectedScenario!} onReset={reset} />;
            case 'error':
                 return <ErrorScreen message={error!} onReset={reset} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-[360px] h-[740px] bg-gray-900 rounded-[40px] shadow-2xl p-4 flex flex-col relative overflow-hidden ring-4 ring-gray-700">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full z-10"></div>
            <div className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-[24px] overflow-y-auto relative">
                {renderScreen()}
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && handleImageSelected(e.target.files[0])}
                    className="hidden"
                    accept="image/*"
                />
            </div>
        </div>
    );
};


const HomeScreen: React.FC<{ onScan: () => void; onSelectSample: () => void; onUpload: () => void; }> = ({ onScan, onSelectSample, onUpload }) => {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col h-full p-6 text-center justify-center items-center">
        <Icon name="leaf" className="w-24 h-24 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold dark:text-white">{t('welcome_to_mavuno')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-8">{t('sim_subtitle_home')}</p>
        <button onClick={onScan} className="w-full bg-green-600 text-white font-bold py-4 px-4 rounded-lg mb-4 hover:bg-green-700 transition-transform active:scale-95">
            {t('sim_btn_scan')}
        </button>
        <button onClick={onUpload} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-4 px-4 rounded-lg mb-4 hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform active:scale-95">
            {t('sim_btn_upload')}
        </button>
        <button onClick={onSelectSample} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-4 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform active:scale-95">
            {t('sim_btn_sample')}
        </button>
    </div>
  );
};

const ScenarioSelectScreen: React.FC<{ onSelect: (s: Scenario) => void; onBack: () => void }> = ({ onSelect, onBack }) => {
   const { t } = useLocalization();
   return (
    <div className="p-4">
        <button onClick={onBack} className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">
            <Icon name="arrow-left" className="w-5 h-5" /> {t('back')}
        </button>
        <h2 className="text-xl font-bold mb-4 dark:text-white">{t('sim_title_scenarios')}</h2>
        <div className="space-y-3">
            {SCENARIOS.map(s => (
                <div key={s.id} onClick={() => onSelect(s)} className="flex items-center gap-4 bg-white dark:bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                    <img src={s.image} alt={s.name} className="w-16 h-16 object-cover rounded-md" />
                    <div>
                        <p className="font-semibold dark:text-white">{s.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{s.crop}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
   );
};

const CameraScreen: React.FC<{ onUpload: () => void; onBack: () => void; onImageCaptured: (file: File) => void; }> = ({ onUpload, onBack, onImageCaptured }) => {
    const { t } = useLocalization();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | null>(null);
    const focusTimeoutRef = useRef<number | null>(null);
    const [isSwitching, setIsSwitching] = useState(false);

    // Check for multiple cameras on mount
    useEffect(() => {
        const checkForMultipleCameras = async () => {
            if (navigator.mediaDevices?.enumerateDevices) {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    setHasMultipleCameras(videoDevices.length > 1);
                } catch (err) {
                    console.error("Could not enumerate devices:", err);
                }
            }
        };
        checkForMultipleCameras();
    }, []);

    // Setup and teardown camera stream
    useEffect(() => {
        let streamInstance: MediaStream | null = null;
        
        const enableCamera = async () => {
             // Stop any existing stream before starting a new one. This is crucial for switching cameras.
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    setError(t('sim_camera_error_unsupported'));
                    return;
                }
                const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: { ideal: facingMode } } 
                });
                streamInstance = mediaStream;
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                // Handle common errors like NotAllowedError
                if ((err as Error).name === 'NotAllowedError') {
                    setError(t('sim_camera_error'));
                } else {
                     setError(t('sim_camera_error_unsupported'));
                }
            }
        };

        enableCamera();

        return () => {
            if (streamInstance) {
                streamInstance.getTracks().forEach(track => track.stop());
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t, facingMode]); // Rerun effect when facingMode changes


    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onImageCaptured(capturedFile);
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };

    const handleSwitchCamera = () => {
        if (!hasMultipleCameras || isSwitching) return;

        setIsSwitching(true);
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');

        // Reset animation state after it completes
        setTimeout(() => setIsSwitching(false), 500); // Match animation duration in CSS
    };

    const handleTapToFocus = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (focusTimeoutRef.current) {
            clearTimeout(focusTimeoutRef.current);
        }

        setFocusPoint({ x, y });
        focusTimeoutRef.current = window.setTimeout(() => setFocusPoint(null), 800);
    };

    return (
        <div className="flex flex-col h-full bg-black text-white relative">
            <div className="absolute top-4 left-4 z-20">
                 <button onClick={onBack} className="bg-black/50 p-2 rounded-full">
                    <Icon name="x" className="w-6 h-6" />
                </button>
            </div>
            
             <div className="absolute top-4 right-4 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-5rem)] z-20 bg-black/50 p-2 rounded-lg text-center text-xs">
                <p>For best results, keep the leaf steady and well-lit.</p>
            </div>
            
            <div className="flex-grow relative bg-gray-900 flex items-center justify-center overflow-hidden" onClick={handleTapToFocus}>
                {error ? (
                    <div className="text-center p-4">
                        <Icon name="exclamation-triangle" className="w-12 h-12 text-red-400 mx-auto mb-2" />
                        <p className="text-red-400">{error}</p>
                    </div>
                ) : (
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isSwitching ? 'animate-camera-flip' : ''}`}></video>
                )}
                 {!stream && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Spinner />
                        <p className="text-gray-400 mt-2">Starting camera...</p>
                    </div>
                 )}
                 {focusPoint && (
                     <div 
                        key={Date.now()} // Re-trigger animation on each click
                        className="absolute w-20 h-20 border-2 border-yellow-400 rounded-md animate-focus-pulse"
                        style={{
                            top: `calc(${focusPoint.y}px - 2.5rem)`,
                            left: `calc(${focusPoint.x}px - 2.5rem)`,
                        }}
                    ></div>
                 )}
            </div>

            <canvas ref={canvasRef} className="hidden"></canvas>

            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent z-10">
                <button onClick={onUpload} title={t('sim_btn_upload')} aria-label={t('sim_btn_upload')} className="p-3 rounded-full hover:bg-white/20 transition text-white">
                    <Icon name="photo" className="w-8 h-8" />
                </button>
                <button onClick={handleCapture} disabled={!stream} className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/50 disabled:bg-gray-400 active:scale-95 transition">
                     <div className="w-16 h-16 rounded-full bg-white ring-2 ring-black"></div>
                </button>
                <button onClick={handleSwitchCamera} disabled={!hasMultipleCameras || isSwitching} title="Switch camera" aria-label="Switch camera" className="p-3 rounded-full hover:bg-white/20 transition text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    <Icon name="arrows-path" className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};


const ImagePreviewScreen: React.FC<{
    imageFile: File;
    onBack: () => void;
    onDiagnose: (file: File, userQuery?: string) => void;
}> = ({ imageFile, onBack, onDiagnose }) => {
    const { t } = useLocalization();
    const imageUrl = useRef(URL.createObjectURL(imageFile)).current;
    const { isListening, transcript, startListening, stopListening, isSupported, setTranscript } = useSpeechRecognition();

    useEffect(() => {
        return () => URL.revokeObjectURL(imageUrl);
    }, [imageUrl]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="relative flex-grow">
                <img src={imageUrl} alt="Captured preview" className="w-full h-full object-cover" />
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-900 shadow-t-lg flex-shrink-0">
                <div className="mb-4">
                    <label htmlFor="voice-notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('voice_note_label')}</label>
                    <div className="relative mt-1">
                        <textarea
                            id="voice-notes"
                            rows={3}
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder={t('voice_note_placeholder')}
                            className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg p-2 pr-12 focus:ring-green-500 focus:border-green-500"
                        />
                        {isSupported && (
                            <button
                                onClick={handleMicClick}
                                className={`absolute right-2 top-2 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700'}`}
                                title={t(isListening ? 'stop_listening' : 'start_listening')}
                            >
                                <Icon name="microphone" className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                     {!isSupported && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{t('voice_note_unsupported')}</p>}
                </div>
                 <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform active:scale-95"
                    >
                        {t('retake_photo')}
                    </button>
                    <button
                        onClick={() => onDiagnose(imageFile, transcript)}
                        className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-transform active:scale-95"
                    >
                        {t('diagnose_plant')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DiagnosingScreen: React.FC = () => {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col h-full justify-center items-center text-center p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      <h2 className="text-xl font-bold mt-6 dark:text-white">{t('sim_diagnosing_title')}</h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2">{t('sim_diagnosing_subtitle')}</p>
    </div>
  );
};

const DiagnosisResultScreen: React.FC<{ diagnosis: Diagnosis; scenario: Scenario; onReset: () => void }> = ({ diagnosis, scenario, onReset }) => {
  const { t } = useLocalization();
  const confidenceColor = diagnosis.confidence > 0.85 ? 'text-green-500' : diagnosis.confidence > 0.6 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="h-full">
      <div className="relative">
        <img src={scenario.image} alt={scenario.name} className="w-full h-48 object-cover" />
        <button onClick={onReset} className="absolute top-3 left-3 bg-black/50 text-white p-2 rounded-full">
          <Icon name="x" className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 -mt-8 bg-gray-100 dark:bg-gray-800 rounded-t-2xl relative">
        <div className="flex justify-between items-start">
            <div>
                 <h2 className="text-2xl font-bold dark:text-white">{diagnosis.label}</h2>
                 <p className="text-sm text-gray-500 dark:text-gray-400 italic">{diagnosis.pestName}</p>
            </div>
            <div className={`text-2xl font-bold ${confidenceColor}`}>
                {(diagnosis.confidence * 100).toFixed(0)}%
            </div>
        </div>
        <div className="mt-4">
            <h3 className="font-bold mb-2 dark:text-white">{t('sim_result_cues_title')}</h3>
            <div className="flex flex-wrap gap-2">
                {diagnosis.cues.map(cue => (
                    <span key={cue} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full">{cue}</span>
                ))}
            </div>
        </div>
        <div className="mt-4">
            <h3 className="font-bold mb-2 dark:text-white">{t('sim_result_explanation_title')}</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{diagnosis.explanation}</p>
        </div>
        <div className="mt-6">
            <button className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-transform active:scale-95">{t('sim_btn_find_treatment')}</button>
        </div>
      </div>
    </div>
  );
};

const ErrorScreen: React.FC<{ message: string; onReset: () => void; }> = ({ message, onReset }) => {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col h-full justify-center items-center text-center p-6">
      <Icon name="exclamation-triangle" className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">{t('sim_error_title')}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <button onClick={onReset} className="bg-gray-200 dark:bg-gray-700 font-bold py-3 px-6 rounded-lg">{t('sim_btn_try_again')}</button>
    </div>
  );
};