import { useState, useEffect, useRef } from 'react';

const VerificacionCamara = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Start the video stream when the component mounts
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error(e));
        }
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
      });

    // Clean up the stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleVerify = () => {
    setIsVerifying(true);
    // Simulate verification delay
    setTimeout(() => {
      // In a real app, we would send the frame to a server for verification
      // For now, we just simulate success
      setIsVerified(true);
      setIsVerifying(false);
    }, 1500);
  };

  if (!stream) {
    return <div className="text-center py-8">Cargando cámara...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <h3 className="text-xl font-bold mb-4">Verificación Facial</h3>
      <div className="relative w-64 h-64 mx-auto mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full rounded-lg object-cover"
        />
        {/* Oval overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <ellipse cx="50" cy="50" rx="40" ry="50" stroke="rgb(59 130 246)" strokeWidth="3" fill="none" />
          </svg>
        </div>
      </div>
      {!isVerified && !isVerifying && (
        <button
          onClick={handleVerify}
          className="bg-accent text-white px-4 py-2 rounded hover:bg-opacity-90"
        >
          Verificar Rostro
        </button>
      )}
      {isVerifying && (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
          <span>Verificando...</span>
        </div>
      )}
      {isVerified && (
        <div className="text-green-600 font-bold mt-2">
          ✅ Rostro verificado exitosamente
        </div>
      )}
    </div>
  );
};

export default VerificacionCamara;