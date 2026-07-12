import { useRef, useState } from 'react';

const FirmaPad = () => {
  const canvasRef = useRef(null);
  const [signature, setSignature] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    setSignature(canvas.toDataURL());
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    startDrawing(e);
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    draw(e);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleMouseLeave = () => {
    stopDrawing();
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing(touch);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    draw(touch);
  };

  const handleTouchEnd = () => {
    stopDrawing();
  };

  return (
    <div className="border border-gray-300 rounded-lg">
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="bg-white cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="flex justify-end p-2">
        <button
          onClick={clearCanvas}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
};

export default FirmaPad;